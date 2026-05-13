//! Microphone capture via cpal (CoreAudio default input device).
//!
//! SCKit's `with_captures_microphone(true)` silent-fails on unsigned dev
//! binaries and ad-hoc-codesigned bundles on macOS 15. cpal goes through the
//! standard mic permission path — first stream start triggers the normal
//! mic prompt — and delivers PCM samples reliably once granted.
//!
//! Output: interleaved 48kHz stereo f32 chunks pushed to `sample_tx` (Opus
//! encoder) and optional `stt_sender` (Soniox fan-out). Same shape as the
//! SCKit `MicrophoneSink` path so the rest of the pipeline is untouched.

use anyhow::{Context, Result};
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{SampleFormat, StreamConfig};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::Sender;
use std::sync::Arc;

const TARGET_RATE: u32 = 48_000;

pub struct MicStream {
    _stream: cpal::Stream,
    pub native_rate: u32,
    pub native_channels: u16,
}

pub fn start(
    sample_tx: Sender<Vec<f32>>,
    stt_sender: Option<Sender<Vec<f32>>>,
    stop: Arc<AtomicBool>,
) -> Result<MicStream> {
    let host = cpal::default_host();
    let device = host
        .default_input_device()
        .context("No default input device — is a microphone connected?")?;
    let device_name = device.name().unwrap_or_else(|_| "<unknown>".to_string());

    let default_cfg = device
        .default_input_config()
        .context("Failed to query default input config")?;
    let native_rate = default_cfg.sample_rate().0;
    let native_channels = default_cfg.channels();
    let sample_format = default_cfg.sample_format();
    let stream_config: StreamConfig = default_cfg.config();

    println!(
        "[mic cpal] device={} rate={}Hz ch={} fmt={:?}",
        device_name, native_rate, native_channels, sample_format
    );

    let ratio = native_rate as f64 / TARGET_RATE as f64;
    let mut src_mono: Vec<f32> = Vec::with_capacity(native_rate as usize);
    let mut cursor: f64 = 0.0;
    let in_ch = native_channels as usize;
    let mut callback_count: u64 = 0;

    let mut process = move |data: &[f32]| {
        if stop.load(Ordering::Relaxed) {
            return;
        }
        callback_count += 1;
        if callback_count <= 3 || callback_count % 100 == 0 {
            let peak = data.iter().fold(0.0_f32, |m, &s| m.max(s.abs()));
            println!(
                "[mic cpal] callback #{callback_count} len={} peak={:.4}",
                data.len(),
                peak
            );
        }
        let frames = data.len() / in_ch;
        src_mono.reserve(frames);
        for f in 0..frames {
            let base = f * in_ch;
            let mut sum = 0.0_f32;
            for c in 0..in_ch {
                sum += data[base + c];
            }
            src_mono.push(sum / in_ch as f32);
        }
        let mut resampled: Vec<f32> = Vec::new();
        loop {
            let idx = cursor as usize;
            if idx + 1 >= src_mono.len() {
                break;
            }
            let frac = (cursor - idx as f64) as f32;
            let s0 = src_mono[idx];
            let s1 = src_mono[idx + 1];
            resampled.push(s0 + (s1 - s0) * frac);
            cursor += ratio;
        }
        // Clamp to src_mono.len() — see stt/resample.rs:64 for the same
        // overshoot-by-RATIO bug. With ratio≥1 the cursor can land 1–2 samples
        // past the buffer end on the last successful push.
        let drop_count = (cursor as usize).min(src_mono.len());
        if drop_count > 0 {
            src_mono.drain(..drop_count);
            cursor -= drop_count as f64;
        }
        if resampled.is_empty() {
            return;
        }
        let mut stereo: Vec<f32> = Vec::with_capacity(resampled.len() * 2);
        for s in &resampled {
            stereo.push(*s);
            stereo.push(*s);
        }
        if let Some(sender) = &stt_sender {
            let _ = sender.send(stereo.clone());
        }
        let _ = sample_tx.send(stereo);
    };

    let err_fn = |err| eprintln!("[mic cpal] stream error: {err}");

    let stream = match sample_format {
        SampleFormat::F32 => device
            .build_input_stream(
                &stream_config,
                move |data: &[f32], _: &_| process(data),
                err_fn,
                None,
            )
            .context("Failed to build f32 input stream")?,
        SampleFormat::I16 => device
            .build_input_stream(
                &stream_config,
                move |data: &[i16], _: &_| {
                    let buf: Vec<f32> = data
                        .iter()
                        .map(|&s| s as f32 / i16::MAX as f32)
                        .collect();
                    process(&buf);
                },
                err_fn,
                None,
            )
            .context("Failed to build i16 input stream")?,
        other => anyhow::bail!("Unsupported mic sample format: {other:?}"),
    };

    stream.play().context("Failed to start mic stream")?;
    println!("[mic cpal] stream playing — samples streaming");

    Ok(MicStream {
        _stream: stream,
        native_rate,
        native_channels,
    })
}
