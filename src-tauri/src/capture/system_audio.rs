//! System audio capture for Bartleby.
//!
//! Captures system audio via ScreenCaptureKit, converts planar PCM buffers to
//! interleaved stereo f32, and writes a 32-bit float WAV file.

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

/// Statistics returned after a completed capture session.
#[derive(Debug, Clone, Serialize)]
pub struct CaptureStats {
    pub buffers_received: usize,
    pub frames_written: usize,
    pub seconds_captured: f64,
}

// ---------------------------------------------------------------------------
// Internal accumulator shared between the audio callback thread and the
// capture driver.
// ---------------------------------------------------------------------------

struct AudioAccumulator {
    samples: Vec<f32>,       // interleaved stereo, 48 kHz
    buffer_count: usize,
}

impl AudioAccumulator {
    fn new() -> Self {
        Self {
            samples: Vec::new(),
            buffer_count: 0,
        }
    }
}

// ---------------------------------------------------------------------------
// SCStreamOutputTrait implementation — our "audio sink"
// ---------------------------------------------------------------------------

struct AudioSink {
    accumulator: Arc<Mutex<AudioAccumulator>>,
}

impl SCStreamOutputTrait for AudioSink {
    fn did_output_sample_buffer(&self, sample: CMSampleBuffer, output_type: SCStreamOutputType) {
        if output_type != SCStreamOutputType::Audio {
            return;
        }

        let Some(buffer_list) = sample.audio_buffer_list() else {
            return;
        };

        // Collect one f32 slice per buffer in the list.
        // ScreenCaptureKit delivers non-interleaved (planar) PCM: each AudioBuffer
        // holds one channel of f32 samples.
        let planes: Vec<&[f32]> = buffer_list
            .iter()
            .map(|buf| bytemuck::cast_slice(buf.data()))
            .collect();

        if planes.is_empty() {
            return;
        }

        let interleaved = planar_to_interleaved_stereo(&planes);

        let mut acc = self.accumulator.lock().unwrap();
        acc.samples.extend_from_slice(&interleaved);
        acc.buffer_count += 1;

        if acc.buffer_count % 100 == 0 {
            println!(
                "Bartleby has heard {} audio buffers ({} interleaved samples so far)...",
                acc.buffer_count,
                acc.samples.len()
            );
        }
    }
}

// ---------------------------------------------------------------------------
// Core public function
// ---------------------------------------------------------------------------

/// Capture system audio for `duration_secs` seconds and write a 32-bit float
/// stereo WAV at `output_path`. Returns [`CaptureStats`] on success.
pub fn capture_to_wav(duration_secs: u64, output_path: &Path) -> Result<CaptureStats> {
    const SAMPLE_RATE: u32 = 48_000;
    const CHANNELS: u16 = 2;

    // ---- 1. Discover displays -------------------------------------------
    let content =
        SCShareableContent::get().context("Failed to query shareable content — is Screen Recording permission granted?")?;

    let display = content
        .displays()
        .into_iter()
        .next()
        .context("No display found")?;

    // ---- 2. Build stream config (audio-focused, minimal video) ----------
    let filter = SCContentFilter::create()
        .with_display(&display)
        .with_excluding_windows(&[])
        .build();

    let config = SCStreamConfiguration::new()
        .with_width(2)
        .with_height(2)
        .with_captures_audio(true)
        .with_sample_rate(SAMPLE_RATE as i32)
        .with_channel_count(i32::from(CHANNELS));

    // ---- 3. Wire up our sink and start ----------------------------------
    let accumulator = Arc::new(Mutex::new(AudioAccumulator::new()));

    let sink = AudioSink {
        accumulator: Arc::clone(&accumulator),
    };

    let mut stream = SCStream::new(&filter, &config);
    stream.add_output_handler(sink, SCStreamOutputType::Audio);

    stream
        .start_capture()
        .context("Failed to start SCStream capture")?;

    println!(
        "Bartleby is listening for {} seconds...",
        duration_secs
    );

    std::thread::sleep(Duration::from_secs(duration_secs));

    stream
        .stop_capture()
        .context("Failed to stop SCStream capture")?;

    println!("Bartleby has finished listening.");

    // ---- 4. Write WAV ---------------------------------------------------
    let acc = accumulator.lock().unwrap();
    let total_interleaved = &acc.samples;
    let frames_written = total_interleaved.len() / usize::from(CHANNELS);

    let wav_spec = hound::WavSpec {
        channels: CHANNELS,
        sample_rate: SAMPLE_RATE,
        bits_per_sample: 32,
        sample_format: hound::SampleFormat::Float,
    };

    let mut writer = hound::WavWriter::create(output_path, wav_spec)
        .context("Failed to create WAV writer")?;

    for &sample in total_interleaved {
        writer
            .write_sample(sample)
            .context("Failed to write WAV sample")?;
    }

    writer.finalize().context("Failed to finalize WAV file")?;

    let seconds_captured = frames_written as f64 / f64::from(SAMPLE_RATE);

    println!(
        "Bartleby wrote {} frames ({:.1}s) to {}",
        frames_written,
        seconds_captured,
        output_path.display()
    );

    Ok(CaptureStats {
        buffers_received: acc.buffer_count,
        frames_written,
        seconds_captured,
    })
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
    use super::planar_to_interleaved_stereo;

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
}
