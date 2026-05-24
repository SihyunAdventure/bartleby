// One-shot recovery tool: re-mux the rolling 5-second Opus segments under a
// session's audio_dir into single sys.opus / mic.opus files with a continuous
// granule timeline. Usage:
//
//   cargo run --example remux_session -- <audio_dir>
//
// Backs the prior (broken) sys.opus/mic.opus up to *.broken.opus before
// writing the new single-stream files.

use std::path::PathBuf;

fn main() -> anyhow::Result<()> {
    let dir: PathBuf = std::env::args()
        .nth(1)
        .map(PathBuf::from)
        .ok_or_else(|| anyhow::anyhow!("usage: remux_session <audio_dir>"))?;
    if !dir.is_dir() {
        anyhow::bail!("not a directory: {}", dir.display());
    }

    for prefix in ["sys", "mic"] {
        let out = dir.join(format!("{prefix}.opus"));
        if out.exists() {
            let backup = dir.join(format!("{prefix}.broken.opus"));
            std::fs::rename(&out, &backup)?;
            println!("[backup] {} → {}", out.display(), backup.display());
        }
        bartleby_lib::capture::encoding::remux_segments_into_single_stream(&dir, prefix)?;
    }
    Ok(())
}
