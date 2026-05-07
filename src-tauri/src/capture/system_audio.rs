//! System audio and microphone capture for Bartleby.
//!
//! Captures system audio and microphone via ScreenCaptureKit, converts planar PCM
//! buffers to interleaved stereo f32, and encodes to rolling 5-second Ogg Opus
//! segment files at 32 kbps — one set per source.
//!
//! Audio callbacks are kept lightweight: each callback sends raw f32 samples
//! over an unbounded mpsc channel to a dedicated encoder worker thread.
//! Encoding is ~50× realtime so the worker never backs up under normal conditions.

use std::path::Path;
use std::sync::{Arc, Mutex};
use std::time::Duration;

use anyhow::{Context, Result};
use serde::Serialize;

use screencapturekit::prelude::{
    SCContentFilter, SCShareableContent, SCStream, SCStreamConfiguration, SCStreamOutputTrait,
    SCStreamOutputType,
};
use screencapturekit::cm::CMSampleBuffer;

use super::encoding::{encoder_worker, EncodingStats};

// ---------------------------------------------------------------------------
// Public stats types
// ---------------------------------------------------------------------------

/// Drift statistics computed from paired presentation timestamps.
#[derive(Debug, Clone, Serialize)]
pub struct DriftStats {
    /// Maximum absolute drift observed across all paired samples, in milliseconds.
    pub max_drift_ms: f64,
    /// Drift at the final paired sample (signed), in milliseconds.
    pub final_drift_ms: f64,
    /// Number of mic traces that were successfully paired with a system trace.
    pub paired_samples: usize,
}

impl DriftStats {
    fn zero() -> Self {
        Self {
            max_drift_ms: 0.0,
            final_drift_ms: 0.0,
            paired_samples: 0,
        }
    }
}

/// Statistics returned after a completed capture session.
#[derive(Debug, Clone, Serialize)]
pub struct CaptureStats {
    /// System audio buffers received from SCStream.
    pub buffers_received: usize,
    /// System audio encoded frames (samples per channel).
    pub frames_written: usize,
    /// System audio seconds captured.
    pub seconds_captured: f64,
    /// Microphone buffers received from SCStream.
    pub mic_buffers_received: usize,
    /// Microphone encoded frames (samples per channel).
    pub mic_frames_written: usize,
    /// Microphone seconds captured.
    pub mic_seconds_captured: f64,
    /// Presentation timestamp drift analysis.
    pub drift: DriftStats,
    /// Number of 5-second system audio segment files written.
    pub system_segments_written: usize,
    /// Total compressed bytes written for system audio.
    pub system_bytes_written: usize,
    /// Number of 5-second microphone segment files written.
    pub mic_segments_written: usize,
    /// Total compressed bytes written for microphone audio.
    pub mic_bytes_written: usize,
}

// ---------------------------------------------------------------------------
// Buffer trace — carries timing info from the callback into drift analysis
// ---------------------------------------------------------------------------

/// Per-buffer timing record used for drift analysis.
#[derive(Debug, Clone)]
pub struct BufferTrace {
    /// Wall-clock instant this buffer was received by the callback.
    pub host_recv_instant: std::time::Instant,
    /// Presentation timestamp in seconds (from CMTime).
    pub pts_seconds: f64,
    /// Frame count in this buffer.
    pub frame_count: usize,
}

// ---------------------------------------------------------------------------
// Internal metadata accumulator — tracks counts and traces, NOT samples
// ---------------------------------------------------------------------------

struct AudioAccumulator {
    buffer_count: usize,
    traces: Vec<BufferTrace>,
}

impl AudioAccumulator {
    fn new() -> Self {
        Self {
            buffer_count: 0,
            traces: Vec::new(),
        }
    }
}

// ---------------------------------------------------------------------------
// Two separate callback structs — system audio and microphone
// ---------------------------------------------------------------------------

struct SystemAudioSink {
    /// Metadata-only (buffer count + timing traces).
    accumulator: Arc<Mutex<AudioAccumulator>>,
    /// Send raw interleaved f32 samples to the encoder worker.
    sample_tx: std::sync::mpsc::Sender<Vec<f32>>,
}

impl SCStreamOutputTrait for SystemAudioSink {
    fn did_output_sample_buffer(&self, sample: CMSampleBuffer, output_type: SCStreamOutputType) {
        if output_type != SCStreamOutputType::Audio {
            return;
        }
        route_audio_buffer(&self.accumulator, &self.sample_tx, sample, "sys");
    }
}

struct MicrophoneSink {
    accumulator: Arc<Mutex<AudioAccumulator>>,
    sample_tx: std::sync::mpsc::Sender<Vec<f32>>,
}

impl SCStreamOutputTrait for MicrophoneSink {
    fn did_output_sample_buffer(&self, sample: CMSampleBuffer, output_type: SCStreamOutputType) {
        if output_type != SCStreamOutputType::Microphone {
            return;
        }
        route_audio_buffer(&self.accumulator, &self.sample_tx, sample, "mic");
    }
}

// ---------------------------------------------------------------------------
// Shared buffer-routing logic (callback → mpsc channel)
// ---------------------------------------------------------------------------

fn route_audio_buffer(
    accumulator: &Arc<Mutex<AudioAccumulator>>,
    sample_tx: &std::sync::mpsc::Sender<Vec<f32>>,
    sample: CMSampleBuffer,
    label: &str,
) {
    let host_recv_instant = std::time::Instant::now();

    let pts_seconds = sample
        .presentation_timestamp()
        .as_seconds()
        .unwrap_or(0.0);

    let Some(buffer_list) = sample.audio_buffer_list() else {
        return;
    };

    let planes: Vec<&[f32]> = buffer_list
        .iter()
        .map(|buf| bytemuck::cast_slice(buf.data()))
        .collect();

    if planes.is_empty() {
        return;
    }

    let interleaved = planar_to_interleaved_stereo(&planes);
    let frame_count = interleaved.len() / 2;

    // Send samples to worker — unbounded channel, non-blocking.
    // If the worker has exited (receiver dropped) we simply discard.
    let _ = sample_tx.send(interleaved);

    let mut acc = accumulator.lock().unwrap();
    acc.buffer_count += 1;
    acc.traces.push(BufferTrace {
        host_recv_instant,
        pts_seconds,
        frame_count,
    });

    if acc.buffer_count % 100 == 0 {
        println!("[{label}] {} buffers received...", acc.buffer_count);
    }
}

// ---------------------------------------------------------------------------
// Core public function
// ---------------------------------------------------------------------------

/// Capture system audio and microphone for `duration_secs` seconds.
///
/// Encodes each source to rolling 5-second Ogg Opus segment files (32 kbps)
/// using the naming pattern `{base}-{seg:03}.opus`.  Returns [`CaptureStats`]
/// with buffer counts, encoded frame counts, and drift analysis.
///
/// # Channel design
/// Uses unbounded `std::sync::mpsc::channel`.  Opus encodes ~50× realtime so
/// the encoder workers never fall behind the SCStream callbacks.  A bounded
/// channel would only introduce unnecessary drop risk.
pub fn capture_dual_to_opus(
    duration_secs: u64,
    system_base_path: &Path,
    mic_base_path: &Path,
) -> Result<CaptureStats> {
    const SAMPLE_RATE: u32 = 48_000;
    const CHANNELS: u16 = 2;

    // ---- 1. Discover displays -------------------------------------------
    let content = SCShareableContent::get()
        .context("Failed to query shareable content — is Screen Recording permission granted?")?;

    let display = content
        .displays()
        .into_iter()
        .next()
        .context("No display found")?;

    // ---- 2. Build stream config (audio + microphone, minimal video) -----
    let filter = SCContentFilter::create()
        .with_display(&display)
        .with_excluding_windows(&[])
        .build();

    let config = SCStreamConfiguration::new()
        .with_width(2)
        .with_height(2)
        .with_captures_audio(true)
        .with_captures_microphone(true)
        .with_sample_rate(SAMPLE_RATE as i32)
        .with_channel_count(i32::from(CHANNELS));

    // ---- 3. Create mpsc channels and metadata accumulators --------------
    let (sys_tx, sys_rx) = std::sync::mpsc::channel::<Vec<f32>>();
    let (mic_tx, mic_rx) = std::sync::mpsc::channel::<Vec<f32>>();

    let sys_accumulator = Arc::new(Mutex::new(AudioAccumulator::new()));
    let mic_accumulator = Arc::new(Mutex::new(AudioAccumulator::new()));

    let sys_sink = SystemAudioSink {
        accumulator: Arc::clone(&sys_accumulator),
        sample_tx: sys_tx,
    };
    let mic_sink = MicrophoneSink {
        accumulator: Arc::clone(&mic_accumulator),
        sample_tx: mic_tx,
    };

    // ---- 4. Spawn encoder workers before starting the stream ------------
    let sys_base = system_base_path.to_path_buf();
    let mic_base = mic_base_path.to_path_buf();

    let sys_worker = std::thread::spawn(move || {
        encoder_worker(sys_rx, &sys_base, "sys")
    });
    let mic_worker = std::thread::spawn(move || {
        encoder_worker(mic_rx, &mic_base, "mic")
    });

    // ---- 5. Wire up sinks and start capture -----------------------------
    let mut stream = SCStream::new(&filter, &config);
    stream.add_output_handler(sys_sink, SCStreamOutputType::Audio);
    stream.add_output_handler(mic_sink, SCStreamOutputType::Microphone);

    stream
        .start_capture()
        .context("Failed to start SCStream capture")?;

    println!("Bartleby is listening for {} seconds...", duration_secs);

    std::thread::sleep(Duration::from_secs(duration_secs));

    stream
        .stop_capture()
        .context("Failed to stop SCStream capture")?;

    println!("Bartleby has finished listening.");

    // ---- 6. Drop senders so workers' recv() loop terminates -------------
    // The sinks are owned by the stream; drop them explicitly via block scope
    // by letting the stream go out of scope.  But we need the accumulators
    // still alive for drift analysis, so we hold Arc refs separately (already done).
    //
    // The senders were moved into the sinks which are inside the stream.
    // When the stream is dropped the sinks are dropped and the senders close.
    drop(stream);

    // ---- 7. Join workers and collect stats -------------------------------
    let sys_enc: EncodingStats = sys_worker
        .join()
        .map_err(|_| anyhow::anyhow!("System audio encoder worker panicked"))?
        .context("System audio encoder worker failed")?;

    let mic_enc: EncodingStats = mic_worker
        .join()
        .map_err(|_| anyhow::anyhow!("Microphone encoder worker panicked"))?
        .context("Microphone encoder worker failed")?;

    // ---- 8. Aggregate stats ---------------------------------------------
    let sys_acc = sys_accumulator.lock().unwrap();
    let mic_acc = mic_accumulator.lock().unwrap();

    let sys_frames = sys_enc.total_frames;
    let mic_frames = mic_enc.total_frames;
    let sys_seconds = sys_frames as f64 / f64::from(SAMPLE_RATE);
    let mic_seconds = mic_frames as f64 / f64::from(SAMPLE_RATE);

    println!(
        "Bartleby encoded {} sys frames ({:.1}s), {} mic frames ({:.1}s)",
        sys_frames, sys_seconds, mic_frames, mic_seconds
    );

    // ---- 9. Compute drift -----------------------------------------------
    let drift = compute_drift(&sys_acc.traces, &mic_acc.traces);

    Ok(CaptureStats {
        buffers_received: sys_acc.buffer_count,
        frames_written: sys_frames,
        seconds_captured: sys_seconds,
        mic_buffers_received: mic_acc.buffer_count,
        mic_frames_written: mic_frames,
        mic_seconds_captured: mic_seconds,
        drift,
        system_segments_written: sys_enc.segments_written,
        system_bytes_written: sys_enc.total_bytes,
        mic_segments_written: mic_enc.segments_written,
        mic_bytes_written: mic_enc.total_bytes,
    })
}

// ---------------------------------------------------------------------------
// Drift analysis
// ---------------------------------------------------------------------------

/// Compute drift between system and microphone presentation timestamps.
///
/// Pairs each mic trace to the nearest system trace by `host_recv_instant`,
/// then removes the initial offset (constant latency is not drift).
pub fn compute_drift(system_traces: &[BufferTrace], mic_traces: &[BufferTrace]) -> DriftStats {
    if system_traces.is_empty() || mic_traces.is_empty() {
        return DriftStats::zero();
    }

    let paired: Vec<(f64, f64)> = mic_traces
        .iter()
        .map(|mic_trace| {
            let sys_trace = system_traces
                .iter()
                .min_by_key(|sys_trace| {
                    let a = mic_trace.host_recv_instant;
                    let b = sys_trace.host_recv_instant;
                    let diff = if a >= b {
                        a.duration_since(b)
                    } else {
                        b.duration_since(a)
                    };
                    diff.as_micros()
                })
                .expect("system_traces is non-empty");
            (sys_trace.pts_seconds, mic_trace.pts_seconds)
        })
        .collect();

    let initial_offset = paired[0].0 - paired[0].1;

    let mut max_drift_ms: f64 = 0.0;
    let mut final_drift_ms: f64 = 0.0;

    for &(sys_pts, mic_pts) in &paired {
        let drift = (sys_pts - mic_pts) - initial_offset;
        let drift_ms = drift * 1000.0;
        if drift_ms.abs() > max_drift_ms {
            max_drift_ms = drift_ms.abs();
        }
        final_drift_ms = drift_ms;
    }

    DriftStats {
        max_drift_ms,
        final_drift_ms,
        paired_samples: paired.len(),
    }
}

// ---------------------------------------------------------------------------
// Audio format helper
// ---------------------------------------------------------------------------

/// Convert a slice of planar (non-interleaved) f32 channel slices to a single
/// interleaved stereo buffer.
///
/// - If `planes` has one channel (mono), that channel is duplicated to both L and R.
/// - If `planes` has two or more channels, only the first two are used.
/// - If `planes` is empty, returns an empty Vec.
pub fn planar_to_interleaved_stereo(planes: &[&[f32]]) -> Vec<f32> {
    if planes.is_empty() {
        return Vec::new();
    }

    let frames = planes[0].len();
    let left = planes[0];
    let right = if planes.len() >= 2 { planes[1] } else { planes[0] };

    let mut out = Vec::with_capacity(2 * frames);
    for i in 0..frames {
        out.push(left[i]);
        out.push(right[i]);
    }
    out
}

// ---------------------------------------------------------------------------
// Unit tests (no SCStream dependency)
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::{compute_drift, planar_to_interleaved_stereo, BufferTrace};
    use std::time::{Duration, Instant};

    fn make_trace(base: Instant, offset_ms: u64, pts: f64) -> BufferTrace {
        BufferTrace {
            host_recv_instant: base + Duration::from_millis(offset_ms),
            pts_seconds: pts,
            frame_count: 960,
        }
    }

    #[test]
    fn mono_duplicates_to_stereo() {
        let mono: &[f32] = &[0.1, 0.2, 0.3];
        let result = planar_to_interleaved_stereo(&[mono]);
        assert_eq!(result, vec![0.1, 0.1, 0.2, 0.2, 0.3, 0.3]);
    }

    #[test]
    fn stereo_passes_through() {
        let left: &[f32] = &[0.1, 0.2];
        let right: &[f32] = &[0.9, 0.8];
        let result = planar_to_interleaved_stereo(&[left, right]);
        assert_eq!(result, vec![0.1, 0.9, 0.2, 0.8]);
    }

    #[test]
    fn empty_planes_returns_empty() {
        let result = planar_to_interleaved_stereo(&[]);
        assert!(result.is_empty());
    }

    #[test]
    fn perfect_sync_returns_zero_drift() {
        let base = Instant::now();
        let sys: Vec<BufferTrace> = (0..5)
            .map(|i| make_trace(base, i * 20, i as f64 * 0.02))
            .collect();
        let mic: Vec<BufferTrace> = (0..5)
            .map(|i| make_trace(base, i * 20, i as f64 * 0.02))
            .collect();

        let stats = compute_drift(&sys, &mic);
        assert_eq!(stats.paired_samples, 5);
        assert!((stats.max_drift_ms).abs() < 1e-9, "max_drift_ms={}", stats.max_drift_ms);
        assert!((stats.final_drift_ms).abs() < 1e-9, "final_drift_ms={}", stats.final_drift_ms);
    }

    #[test]
    fn constant_offset_subtracts_to_zero() {
        let base = Instant::now();
        let sys: Vec<BufferTrace> = (0..5)
            .map(|i| make_trace(base, i * 20, i as f64 * 0.02))
            .collect();
        let mic: Vec<BufferTrace> = (0..5)
            .map(|i| make_trace(base, i * 20, i as f64 * 0.02 - 0.1))
            .collect();

        let stats = compute_drift(&sys, &mic);
        assert_eq!(stats.paired_samples, 5);
        assert!(stats.max_drift_ms.abs() < 1e-6, "max_drift_ms={}", stats.max_drift_ms);
        assert!(stats.final_drift_ms.abs() < 1e-6, "final_drift_ms={}", stats.final_drift_ms);
    }

    #[test]
    fn growing_drift_returns_max() {
        let base = Instant::now();
        let n = 5usize;
        let sys: Vec<BufferTrace> = (0..n)
            .map(|i| make_trace(base, (i * 20) as u64, i as f64 * 0.02))
            .collect();
        let mic: Vec<BufferTrace> = (0..n)
            .map(|i| make_trace(base, (i * 20) as u64, i as f64 * 0.02 - i as f64 * 0.001))
            .collect();

        let stats = compute_drift(&sys, &mic);
        assert_eq!(stats.paired_samples, n);
        let expected_max_ms = (n - 1) as f64;
        assert!(
            (stats.max_drift_ms - expected_max_ms).abs() < 1e-6,
            "max_drift_ms={}, expected≈{}",
            stats.max_drift_ms,
            expected_max_ms
        );
        assert!(
            (stats.final_drift_ms - expected_max_ms).abs() < 1e-6,
            "final_drift_ms={}",
            stats.final_drift_ms
        );
    }

    #[test]
    fn empty_traces_returns_zero() {
        let base = Instant::now();
        let non_empty: Vec<BufferTrace> = vec![make_trace(base, 0, 0.0)];

        let stats = compute_drift(&[], &[]);
        assert_eq!(stats.paired_samples, 0);
        assert_eq!(stats.max_drift_ms, 0.0);
        assert_eq!(stats.final_drift_ms, 0.0);

        let stats = compute_drift(&[], &non_empty);
        assert_eq!(stats.paired_samples, 0);

        let stats = compute_drift(&non_empty, &[]);
        assert_eq!(stats.paired_samples, 0);
    }
}
