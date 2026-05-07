//! System audio and microphone capture for Bartleby.
//!
//! Captures system audio and microphone via ScreenCaptureKit, converts planar PCM
//! buffers to interleaved stereo f32, and writes 32-bit float WAV files — one per source.

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
    /// System audio buffers received.
    pub buffers_received: usize,
    /// System audio frames written to WAV.
    pub frames_written: usize,
    /// System audio seconds captured.
    pub seconds_captured: f64,
    /// Microphone buffers received.
    pub mic_buffers_received: usize,
    /// Microphone frames written to WAV.
    pub mic_frames_written: usize,
    /// Microphone seconds captured.
    pub mic_seconds_captured: f64,
    /// Presentation timestamp drift analysis.
    pub drift: DriftStats,
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
// Internal accumulators — one per source, never shared between sinks
// ---------------------------------------------------------------------------

struct AudioAccumulator {
    samples: Vec<f32>,       // interleaved stereo, 48 kHz
    buffer_count: usize,
    traces: Vec<BufferTrace>,
}

impl AudioAccumulator {
    fn new() -> Self {
        Self {
            samples: Vec::new(),
            buffer_count: 0,
            traces: Vec::new(),
        }
    }
}

// ---------------------------------------------------------------------------
// Two separate sink structs — system audio and microphone
// ---------------------------------------------------------------------------

struct SystemAudioSink {
    accumulator: Arc<Mutex<AudioAccumulator>>,
}

impl SCStreamOutputTrait for SystemAudioSink {
    fn did_output_sample_buffer(&self, sample: CMSampleBuffer, output_type: SCStreamOutputType) {
        if output_type != SCStreamOutputType::Audio {
            return;
        }
        push_audio_buffer(&self.accumulator, sample, "sys");
    }
}

struct MicrophoneSink {
    accumulator: Arc<Mutex<AudioAccumulator>>,
}

impl SCStreamOutputTrait for MicrophoneSink {
    fn did_output_sample_buffer(&self, sample: CMSampleBuffer, output_type: SCStreamOutputType) {
        if output_type != SCStreamOutputType::Microphone {
            return;
        }
        push_audio_buffer(&self.accumulator, sample, "mic");
    }
}

// ---------------------------------------------------------------------------
// Shared buffer-push logic
// ---------------------------------------------------------------------------

fn push_audio_buffer(
    accumulator: &Arc<Mutex<AudioAccumulator>>,
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

    let mut acc = accumulator.lock().unwrap();
    acc.samples.extend_from_slice(&interleaved);
    acc.buffer_count += 1;
    acc.traces.push(BufferTrace {
        host_recv_instant,
        pts_seconds,
        frame_count,
    });

    if acc.buffer_count % 100 == 0 {
        println!(
            "[{label}] {} buffers ({} interleaved samples so far)...",
            acc.buffer_count,
            acc.samples.len()
        );
    }
}

// ---------------------------------------------------------------------------
// Core public function
// ---------------------------------------------------------------------------

/// Capture system audio and microphone for `duration_secs` seconds.
///
/// Writes a 32-bit float stereo WAV for each source and returns [`CaptureStats`].
/// Both paths must be distinct; mixing is deferred to a later slice.
pub fn capture_dual_to_wav(
    duration_secs: u64,
    system_output_path: &Path,
    mic_output_path: &Path,
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

    // ---- 3. Wire up two independent sinks and start ---------------------
    let sys_accumulator = Arc::new(Mutex::new(AudioAccumulator::new()));
    let mic_accumulator = Arc::new(Mutex::new(AudioAccumulator::new()));

    let sys_sink = SystemAudioSink {
        accumulator: Arc::clone(&sys_accumulator),
    };
    let mic_sink = MicrophoneSink {
        accumulator: Arc::clone(&mic_accumulator),
    };

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

    // ---- 4. Write system audio WAV -------------------------------------
    let sys_acc = sys_accumulator.lock().unwrap();
    let sys_interleaved = &sys_acc.samples;
    let sys_frames = sys_interleaved.len() / usize::from(CHANNELS);

    write_wav(system_output_path, sys_interleaved, CHANNELS, SAMPLE_RATE)
        .context("Failed to write system audio WAV")?;

    let sys_seconds = sys_frames as f64 / f64::from(SAMPLE_RATE);
    println!(
        "Bartleby wrote {} sys frames ({:.1}s) to {}",
        sys_frames,
        sys_seconds,
        system_output_path.display()
    );

    // ---- 5. Write microphone WAV ---------------------------------------
    let mic_acc = mic_accumulator.lock().unwrap();
    let mic_interleaved = &mic_acc.samples;
    let mic_frames = mic_interleaved.len() / usize::from(CHANNELS);

    write_wav(mic_output_path, mic_interleaved, CHANNELS, SAMPLE_RATE)
        .context("Failed to write microphone WAV")?;

    let mic_seconds = mic_frames as f64 / f64::from(SAMPLE_RATE);
    println!(
        "Bartleby wrote {} mic frames ({:.1}s) to {}",
        mic_frames,
        mic_seconds,
        mic_output_path.display()
    );

    // ---- 6. Compute drift ---------------------------------------------
    let drift = compute_drift(&sys_acc.traces, &mic_acc.traces);

    Ok(CaptureStats {
        buffers_received: sys_acc.buffer_count,
        frames_written: sys_frames,
        seconds_captured: sys_seconds,
        mic_buffers_received: mic_acc.buffer_count,
        mic_frames_written: mic_frames,
        mic_seconds_captured: mic_seconds,
        drift,
    })
}

// ---------------------------------------------------------------------------
// WAV writer helper
// ---------------------------------------------------------------------------

fn write_wav(path: &Path, samples: &[f32], channels: u16, sample_rate: u32) -> Result<()> {
    let wav_spec = hound::WavSpec {
        channels,
        sample_rate,
        bits_per_sample: 32,
        sample_format: hound::SampleFormat::Float,
    };

    let mut writer =
        hound::WavWriter::create(path, wav_spec).context("Failed to create WAV writer")?;

    for &sample in samples {
        writer
            .write_sample(sample)
            .context("Failed to write WAV sample")?;
    }

    writer.finalize().context("Failed to finalize WAV file")
}

// ---------------------------------------------------------------------------
// Drift analysis
// ---------------------------------------------------------------------------

/// Compute drift between system and microphone presentation timestamps.
///
/// Pairs each mic trace to the nearest system trace by `host_recv_instant`,
/// then removes the initial offset (constant latency is not drift).
///
/// - `max_drift_ms`: maximum absolute deviation from the initial offset
/// - `final_drift_ms`: signed drift at the last paired sample
/// - `paired_samples`: number of mic traces successfully paired
pub fn compute_drift(system_traces: &[BufferTrace], mic_traces: &[BufferTrace]) -> DriftStats {
    if system_traces.is_empty() || mic_traces.is_empty() {
        return DriftStats::zero();
    }

    // Pair each mic trace to the nearest (by host_recv_instant) system trace.
    let paired: Vec<(f64, f64)> = mic_traces
        .iter()
        .map(|mic_trace| {
            let sys_trace = system_traces
                .iter()
                .min_by_key(|sys_trace| {
                    // Compute absolute duration between the two instants.
                    let a = mic_trace.host_recv_instant;
                    let b = sys_trace.host_recv_instant;
                    let diff = if a >= b {
                        a.duration_since(b)
                    } else {
                        b.duration_since(a)
                    };
                    // Use microseconds as the key — sub-microsecond precision not needed.
                    diff.as_micros()
                })
                .expect("system_traces is non-empty");
            (sys_trace.pts_seconds, mic_trace.pts_seconds)
        })
        .collect();

    // Initial offset: difference in PTS at time-0 (removes constant latency).
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
///
/// The output length is always `2 * frames` where `frames = planes[0].len()`.
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

    // -- planar_to_interleaved_stereo --

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

    // -- compute_drift --

    /// Helper: build a trace with a fixed pts and an instant offset from a base.
    fn make_trace(base: Instant, offset_ms: u64, pts: f64) -> BufferTrace {
        BufferTrace {
            host_recv_instant: base + Duration::from_millis(offset_ms),
            pts_seconds: pts,
            frame_count: 960,
        }
    }

    #[test]
    fn perfect_sync_returns_zero_drift() {
        let base = Instant::now();
        // sys and mic arrive at the same instants with the same PTS values.
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
        // Mic PTS is always 100ms behind sys PTS — that is a constant offset, not drift.
        let base = Instant::now();
        let sys: Vec<BufferTrace> = (0..5)
            .map(|i| make_trace(base, i * 20, i as f64 * 0.02))
            .collect();
        let mic: Vec<BufferTrace> = (0..5)
            .map(|i| make_trace(base, i * 20, i as f64 * 0.02 - 0.1))
            .collect();

        let stats = compute_drift(&sys, &mic);

        assert_eq!(stats.paired_samples, 5);
        // After subtracting the initial offset (0.1s), all drifts should be ~0.
        assert!(stats.max_drift_ms.abs() < 1e-6, "max_drift_ms={}", stats.max_drift_ms);
        assert!(stats.final_drift_ms.abs() < 1e-6, "final_drift_ms={}", stats.final_drift_ms);
    }

    #[test]
    fn growing_drift_returns_max() {
        // Mic PTS drifts by 1ms per sample relative to sys (accumulating, so it's
        // beyond the constant initial offset). N=5 samples → drift grows 0,1,2,3,4 ms.
        let base = Instant::now();
        let n = 5usize;
        let sys: Vec<BufferTrace> = (0..n)
            .map(|i| make_trace(base, (i * 20) as u64, i as f64 * 0.02))
            .collect();
        // mic[0] has the same relative pts as sys[0] (sets initial_offset),
        // then each subsequent mic sample is 1ms further behind.
        let mic: Vec<BufferTrace> = (0..n)
            .map(|i| make_trace(base, (i * 20) as u64, i as f64 * 0.02 - i as f64 * 0.001))
            .collect();

        let stats = compute_drift(&sys, &mic);

        assert_eq!(stats.paired_samples, n);
        // max drift = (n-1) * 1ms = 4ms; allow small float rounding.
        let expected_max_ms = (n - 1) as f64;
        assert!(
            (stats.max_drift_ms - expected_max_ms).abs() < 1e-6,
            "max_drift_ms={}, expected≈{}",
            stats.max_drift_ms,
            expected_max_ms
        );
        // final drift is signed (mic is behind sys → positive drift in our convention).
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

        // Both empty.
        let stats = compute_drift(&[], &[]);
        assert_eq!(stats.paired_samples, 0);
        assert_eq!(stats.max_drift_ms, 0.0);
        assert_eq!(stats.final_drift_ms, 0.0);

        // System empty.
        let stats = compute_drift(&[], &non_empty);
        assert_eq!(stats.paired_samples, 0);

        // Mic empty.
        let stats = compute_drift(&non_empty, &[]);
        assert_eq!(stats.paired_samples, 0);
    }
}
