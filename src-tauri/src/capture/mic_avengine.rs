//! Microphone capture via Swift AVAudioEngine sidecar.
//!
//! SCKit's `with_captures_microphone(true)` and cpal both silent-fail on
//! macOS 15.x dev builds even with Developer ID + entitlements + a TCC
//! grant in place (`AVCaptureDevice.requestAccess` returns granted=true,
//! but mic buffers never arrive). AVAudioEngine is Apple's blessed path
//! and surfaces real samples.
//!
//! The Swift sidecar binary `bartleby-mic` (placed next to the main
//! executable in `Bartleby.app/Contents/MacOS/`) does the installTap +
//! AVAudioConverter dance and writes 48 kHz mono f32 LE to stdout. This
//! module spawns it, reads the stream in fixed-size chunks, and
//! stereo-duplicates into the existing `sample_tx` (Opus encoder) and
//! optional `stt_sender` (Soniox) fan-out — same shape as cpal mic.rs.
//!
//! Lifecycle: dropping `MicEngineStream` kills the child, which closes
//! stdout, which makes the reader thread exit its `read_exact` loop.

use anyhow::{Context, Result};
use std::io::{BufReader, Read};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::mpsc::Sender;
use std::sync::Arc;
use std::thread::JoinHandle;

const CHUNK_FRAMES: usize = 1024;
const CHUNK_BYTES: usize = CHUNK_FRAMES * 4;
/// Linear amplitude threshold above which we treat the system audio as
/// "actively playing" and suppress the mic's STT fan-out to dodge acoustic
/// crosstalk. 0.056 ≈ -25 dBFS — well below speech volume but well above
/// the resting noise floor of a quiet room. Sys Opus capture and mic Opus
/// capture both continue regardless; only the mic→STT fan-out is gated.
const SYS_ACTIVE_THRESHOLD: f32 = 0.056;

/// Envelope release coefficient applied to the sys-peak gate per chunk
/// (≈21ms at 48kHz / 1024 frames). 0.92 decays to ~10% over ~250ms — long
/// enough to bridge inter-word silences in conversational speech so the
/// mic's STT stays muted across the whole turn, short enough that a real
/// pause (>~500ms) releases the gate within a beat.
const SYS_ENVELOPE_RELEASE: f32 = 0.92;

pub struct MicEngineStream {
    child: Option<Child>,
    reader: Option<JoinHandle<()>>,
}

impl Drop for MicEngineStream {
    fn drop(&mut self) {
        if let Some(mut child) = self.child.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
        if let Some(handle) = self.reader.take() {
            let _ = handle.join();
        }
    }
}

pub fn start(
    sample_tx: Sender<Vec<f32>>,
    stt_sender: Option<Sender<Vec<f32>>>,
    sys_peak_bits: Arc<AtomicU32>,
    stop: Arc<AtomicBool>,
) -> Result<MicEngineStream> {
    let sidecar = locate_sidecar()?;

    let mut child = Command::new(&sidecar)
        .stdout(Stdio::piped())
        .stderr(Stdio::inherit())
        .spawn()
        .with_context(|| format!("Failed to spawn {}", sidecar.display()))?;

    let stdout = child
        .stdout
        .take()
        .context("Failed to capture sidecar stdout")?;

    let reader = std::thread::spawn(move || {
        let mut reader = BufReader::with_capacity(64 * 1024, stdout);
        let mut buf = vec![0u8; CHUNK_BYTES];
        let mut sys_envelope: f32 = 0.0;

        while !stop.load(Ordering::Relaxed) {
            if reader.read_exact(&mut buf).is_err() {
                break;
            }

            let mono: Vec<f32> = buf
                .chunks_exact(4)
                .map(|c| f32::from_le_bytes([c[0], c[1], c[2], c[3]]))
                .collect();

            let mut stereo: Vec<f32> = Vec::with_capacity(mono.len() * 2);
            for s in &mono {
                stereo.push(*s);
                stereo.push(*s);
            }

            // Phase 6 S4 — STT crosstalk gate with envelope follower.
            // Instantaneous sys peak alone leaks during inter-word silences
            // (sys peak briefly dips below threshold mid-sentence, gate
            // releases, mic echo gets transcribed). Tracking an attack-fast
            // / release-slow envelope holds the gate across short pauses
            // so the whole sys turn is suppressed, releasing only when sys
            // is truly silent for ~half a second. Opus capture is
            // unaffected — only the live caption fan-out is gated.
            let sys_peak = f32::from_bits(sys_peak_bits.load(Ordering::Relaxed));
            sys_envelope = sys_peak.max(sys_envelope * SYS_ENVELOPE_RELEASE);
            let gate_stt = sys_envelope > SYS_ACTIVE_THRESHOLD;

            if !gate_stt {
                if let Some(s) = &stt_sender {
                    let _ = s.send(stereo.clone());
                }
            }
            if sample_tx.send(stereo).is_err() {
                break;
            }
        }
    });

    println!("[mic engine] spawned {}", sidecar.display());

    Ok(MicEngineStream {
        child: Some(child),
        reader: Some(reader),
    })
}

fn locate_sidecar() -> Result<PathBuf> {
    let exe = std::env::current_exe().context("current_exe")?;
    let candidates = sidecar_candidates(&exe)?;

    for path in &candidates {
        if path.exists() {
            return Ok(path.clone());
        }
    }

    anyhow::bail!(
        "bartleby-mic sidecar not found. Tried: {}",
        candidates
            .iter()
            .map(|path| path.display().to_string())
            .collect::<Vec<_>>()
            .join(", ")
    )
}

fn sidecar_candidates(exe: &Path) -> Result<Vec<PathBuf>> {
    let dir = exe.parent().context("exe has no parent")?;
    let names = [
        "bartleby-mic",
        "bartleby-mic-universal-apple-darwin",
        #[cfg(target_arch = "aarch64")]
        "bartleby-mic-aarch64-apple-darwin",
        #[cfg(target_arch = "x86_64")]
        "bartleby-mic-x86_64-apple-darwin",
        "bartleby-mic-aarch64-apple-darwin",
        "bartleby-mic-x86_64-apple-darwin",
    ];

    let mut candidates = Vec::new();
    for name in names {
        candidates.push(dir.join(name));
    }

    if let Some(contents_dir) = dir.parent() {
        let resources_dir = contents_dir.join("Resources");
        for name in names {
            candidates.push(resources_dir.join(name));
        }
    }

    // Dev/build fallback: `pnpm build:sidecar` writes target-suffixed binaries
    // here before Tauri embeds them. This keeps `tauri dev` and direct cargo
    // runs diagnosable instead of depending on a manually copied sidecar.
    if let Some(manifest_dir) = option_env!("CARGO_MANIFEST_DIR") {
        let binaries_dir = PathBuf::from(manifest_dir).join("binaries");
        for name in names {
            candidates.push(binaries_dir.join(name));
        }
    }

    candidates.sort();
    candidates.dedup();
    Ok(candidates)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sidecar_candidates_include_bundle_and_generated_binary_locations() {
        let exe = Path::new("/Applications/Bartleby.app/Contents/MacOS/bartleby");
        let candidates = sidecar_candidates(exe).expect("candidates");
        let rendered = candidates
            .iter()
            .map(|path| path.to_string_lossy().to_string())
            .collect::<Vec<_>>();

        assert!(rendered
            .iter()
            .any(|path| path.ends_with("Contents/MacOS/bartleby-mic")));
        assert!(rendered
            .iter()
            .any(|path| path.ends_with("Contents/Resources/bartleby-mic")));
        assert!(rendered
            .iter()
            .any(|path| path.ends_with("binaries/bartleby-mic-universal-apple-darwin")));
    }
}
