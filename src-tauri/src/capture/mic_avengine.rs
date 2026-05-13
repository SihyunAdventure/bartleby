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
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::Sender;
use std::sync::Arc;
use std::thread::JoinHandle;

const CHUNK_FRAMES: usize = 1024;
const CHUNK_BYTES: usize = CHUNK_FRAMES * 4;

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
        let mut callback: u64 = 0;

        while !stop.load(Ordering::Relaxed) {
            if let Err(e) = reader.read_exact(&mut buf) {
                eprintln!("[mic engine] reader exit: {e}");
                break;
            }
            callback += 1;

            let mono: Vec<f32> = buf
                .chunks_exact(4)
                .map(|c| f32::from_le_bytes([c[0], c[1], c[2], c[3]]))
                .collect();

            if callback <= 3 || callback % 100 == 0 {
                let peak = mono.iter().fold(0.0_f32, |m, &s| m.max(s.abs()));
                println!(
                    "[mic engine] callback #{callback} frames={} peak={:.4}",
                    mono.len(),
                    peak
                );
            }

            let mut stereo: Vec<f32> = Vec::with_capacity(mono.len() * 2);
            for s in &mono {
                stereo.push(*s);
                stereo.push(*s);
            }

            if let Some(s) = &stt_sender {
                let _ = s.send(stereo.clone());
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
    let dir = exe.parent().context("exe has no parent")?;
    let path = dir.join("bartleby-mic");
    if path.exists() {
        Ok(path)
    } else {
        anyhow::bail!(
            "bartleby-mic sidecar not found at {} — dev-run.sh swiftc step missing?",
            path.display()
        )
    }
}
