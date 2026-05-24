//! Process RSS (resident set size) sampler.
//!
//! Spawns a sampling loop that records the calling process's RSS at a fixed
//! interval and writes a CSV log line for each sample. Returns aggregate stats
//! (peak, mean, sample count) when the stop flag is set.
//!
//! On macOS we use `proc_pidinfo(PROC_PIDTASKINFO)` to read `pti_resident_size`
//! directly — no shell-out, no system-wide table refresh, no extra deps beyond
//! `libc` (already a transitive dep).

use std::io::Write;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};

use anyhow::{Context, Result};
use serde::Serialize;

/// Sampling interval — every 5 seconds (matches Day 5 acceptance plan).
const SAMPLE_INTERVAL: Duration = Duration::from_secs(5);

/// Stop-flag poll granularity inside the sleep window. Keeps stop latency
/// bounded to ~200ms regardless of `SAMPLE_INTERVAL`.
const STOP_POLL_INTERVAL: Duration = Duration::from_millis(200);

#[derive(Debug, Clone, Serialize)]
pub struct RssStats {
    pub samples: usize,
    pub peak_rss_mb: f64,
    pub mean_rss_mb: f64,
    pub log_path: String,
}

impl RssStats {
    pub fn empty(log_path: PathBuf) -> Self {
        Self {
            samples: 0,
            peak_rss_mb: 0.0,
            mean_rss_mb: 0.0,
            log_path: log_path.to_string_lossy().into_owned(),
        }
    }
}

/// Read current RSS for the calling process in bytes (macOS).
#[cfg(target_os = "macos")]
fn current_rss_bytes() -> Option<u64> {
    // SAFETY: `proc_pidinfo` writes exactly `size_of::<proc_taskinfo>()` bytes
    // into the zeroed buffer when it returns that value, and reads only the
    // current process's own task table. No aliasing or lifetime concerns.
    unsafe {
        let mut info: libc::proc_taskinfo = std::mem::zeroed();
        let size = std::mem::size_of::<libc::proc_taskinfo>() as i32;
        let ret = libc::proc_pidinfo(
            libc::getpid(),
            libc::PROC_PIDTASKINFO,
            0,
            &mut info as *mut _ as *mut libc::c_void,
            size,
        );
        if ret == size {
            Some(info.pti_resident_size)
        } else {
            None
        }
    }
}

#[cfg(not(target_os = "macos"))]
fn current_rss_bytes() -> Option<u64> {
    None
}

/// Sample RSS at `SAMPLE_INTERVAL` until `stop_flag` is set, writing a CSV log
/// to `log_path` and returning aggregate stats.
///
/// Log format: `elapsed_s,rss_mb` (header on first line).
pub fn rss_sampler(stop_flag: Arc<AtomicBool>, log_path: PathBuf) -> Result<RssStats> {
    let mut log_file = std::fs::File::create(&log_path)
        .with_context(|| format!("Failed to create RSS log at {}", log_path.display()))?;
    writeln!(log_file, "elapsed_s,rss_mb").ok();

    let start = Instant::now();
    let mut peak: u64 = 0;
    let mut sum: u128 = 0;
    let mut samples: usize = 0;

    loop {
        if let Some(rss) = current_rss_bytes() {
            peak = peak.max(rss);
            sum = sum.saturating_add(u128::from(rss));
            samples += 1;
            let elapsed = start.elapsed().as_secs_f64();
            let rss_mb = rss as f64 / 1_048_576.0;
            writeln!(log_file, "{:.1},{:.2}", elapsed, rss_mb).ok();
            // Flush so the log is durable mid-capture in case of crash.
            log_file.flush().ok();
        }

        // Sleep in small ticks so we react to the stop flag promptly.
        let wake = Instant::now() + SAMPLE_INTERVAL;
        while Instant::now() < wake {
            if stop_flag.load(Ordering::Relaxed) {
                break;
            }
            std::thread::sleep(STOP_POLL_INTERVAL);
        }
        if stop_flag.load(Ordering::Relaxed) {
            break;
        }
    }

    let mean_bytes = if samples > 0 {
        (sum / samples as u128) as f64
    } else {
        0.0
    };

    Ok(RssStats {
        samples,
        peak_rss_mb: peak as f64 / 1_048_576.0,
        mean_rss_mb: mean_bytes / 1_048_576.0,
        log_path: log_path.to_string_lossy().into_owned(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sampler_terminates_on_stop_flag() {
        let stop = Arc::new(AtomicBool::new(false));
        let log_path = std::env::temp_dir().join(format!(
            "bartleby-rss-test-{}.log",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));

        let stop_clone = Arc::clone(&stop);
        let path_clone = log_path.clone();
        let handle = std::thread::spawn(move || rss_sampler(stop_clone, path_clone));

        // Let the sampler take at least one reading.
        std::thread::sleep(Duration::from_millis(300));
        stop.store(true, Ordering::Relaxed);

        let stats = handle
            .join()
            .expect("worker panicked")
            .expect("sampler error");
        // On macOS we should have at least 1 sample; on other platforms 0.
        #[cfg(target_os = "macos")]
        {
            assert!(
                stats.samples >= 1,
                "expected ≥1 sample, got {}",
                stats.samples
            );
            assert!(stats.peak_rss_mb > 0.0, "peak_rss_mb should be positive");
        }
        #[cfg(not(target_os = "macos"))]
        {
            let _ = stats;
        }
        let _ = std::fs::remove_file(&log_path);
    }
}
