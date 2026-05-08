//! DRM silence detection for system audio.
//!
//! Apple TV+ / Netflix silence system audio for DRM-protected content while
//! still letting capture succeed (zero-filled buffers). Track the peak RMS
//! across captured frames; if peak stays below `DRM_SILENCE_THRESHOLD_DBFS`
//! over the capture window, the content is DRM-blocked from the user's
//! perspective and we surface that explicitly in the UI.

/// Below this peak dBFS over a capture window we treat the source as silent.
/// -60 dBFS leaves ~30 dB headroom over the digital noise floor of typical
/// playback while still flagging DRM zero-fill (~ -inf dBFS).
pub const DRM_SILENCE_THRESHOLD_DBFS: f64 = -60.0;

/// Sentinel returned for silence (RMS == 0). Real captures don't reach this.
pub const NEGATIVE_INFINITY_DBFS: f64 = -120.0;

/// Linear RMS over an interleaved sample slice (channel layout doesn't matter).
pub fn rms_interleaved(samples: &[f32]) -> f64 {
    if samples.is_empty() {
        return 0.0;
    }
    let sum_sq: f64 = samples.iter().map(|s| (*s as f64).powi(2)).sum();
    (sum_sq / samples.len() as f64).sqrt()
}

/// Convert linear RMS in [0, 1] to dBFS, clamping silence to a finite sentinel.
pub fn linear_to_dbfs(rms: f64) -> f64 {
    if rms <= 0.0 {
        NEGATIVE_INFINITY_DBFS
    } else {
        20.0 * rms.log10()
    }
}

/// Tracks the peak dBFS observed across an in-progress capture and decides
/// whether the source is DRM-silent.
#[derive(Debug, Clone)]
pub struct DrmDetector {
    peak_dbfs: f64,
    samples_observed: usize,
}

impl Default for DrmDetector {
    fn default() -> Self {
        Self {
            peak_dbfs: NEGATIVE_INFINITY_DBFS,
            samples_observed: 0,
        }
    }
}

impl DrmDetector {
    pub fn new() -> Self {
        Self::default()
    }

    /// Update peak with a new buffer of interleaved samples.
    pub fn observe(&mut self, samples: &[f32]) {
        if samples.is_empty() {
            return;
        }
        let rms = rms_interleaved(samples);
        let dbfs = linear_to_dbfs(rms);
        if dbfs > self.peak_dbfs {
            self.peak_dbfs = dbfs;
        }
        self.samples_observed += samples.len();
    }

    pub fn peak_dbfs(&self) -> f64 {
        self.peak_dbfs
    }

    pub fn samples_observed(&self) -> usize {
        self.samples_observed
    }

    /// True iff we observed at least `min_samples` and peak stayed below the
    /// silence threshold. The min_samples gate prevents flagging DRM on the
    /// first empty buffer before any audio has actually played.
    pub fn is_drm_blocked(&self, min_samples: usize) -> bool {
        self.samples_observed >= min_samples && self.peak_dbfs < DRM_SILENCE_THRESHOLD_DBFS
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rms_of_silence_is_zero() {
        let zeros = vec![0.0f32; 1024];
        assert_eq!(rms_interleaved(&zeros), 0.0);
    }

    #[test]
    fn rms_of_dc_one_is_one() {
        let ones = vec![1.0f32; 1024];
        assert!((rms_interleaved(&ones) - 1.0).abs() < 1e-9);
    }

    #[test]
    fn rms_of_unit_sine_is_root_half() {
        // Discretized full-cycle sine, sufficient samples for RMS ≈ 1/√2.
        let n = 4096;
        let samples: Vec<f32> = (0..n)
            .map(|i| (2.0 * std::f64::consts::PI * i as f64 / n as f64).sin() as f32)
            .collect();
        let rms = rms_interleaved(&samples);
        assert!((rms - (0.5_f64).sqrt()).abs() < 1e-3, "rms={rms}");
    }

    #[test]
    fn empty_returns_zero_rms() {
        let empty: Vec<f32> = vec![];
        assert_eq!(rms_interleaved(&empty), 0.0);
    }

    #[test]
    fn dbfs_of_zero_is_sentinel() {
        assert_eq!(linear_to_dbfs(0.0), NEGATIVE_INFINITY_DBFS);
    }

    #[test]
    fn dbfs_of_full_scale_is_zero() {
        assert!((linear_to_dbfs(1.0) - 0.0).abs() < 1e-9);
    }

    #[test]
    fn dbfs_of_half_scale_is_about_minus_six() {
        // 20*log10(0.5) ≈ -6.0206 dBFS
        let dbfs = linear_to_dbfs(0.5);
        assert!((dbfs - (-6.0206)).abs() < 1e-3, "dbfs={dbfs}");
    }

    #[test]
    fn detector_silent_buffers_flag_drm() {
        let mut det = DrmDetector::new();
        for _ in 0..10 {
            det.observe(&vec![0.0f32; 480]); // 10ms @ 48kHz
        }
        assert_eq!(det.peak_dbfs(), NEGATIVE_INFINITY_DBFS);
        assert!(det.is_drm_blocked(1)); // any min_samples
    }

    #[test]
    fn detector_loud_buffers_do_not_flag() {
        let mut det = DrmDetector::new();
        let loud = vec![0.5f32; 4800];
        for _ in 0..3 {
            det.observe(&loud);
        }
        // 0.5 RMS → ~-6 dBFS, well above -60
        assert!(det.peak_dbfs() > DRM_SILENCE_THRESHOLD_DBFS);
        assert!(!det.is_drm_blocked(1));
    }

    #[test]
    fn detector_min_samples_gate() {
        let det = DrmDetector::new();
        // Fresh detector with no samples observed: not flagged regardless of
        // peak (which is -∞ sentinel) because gate isn't met.
        assert!(!det.is_drm_blocked(1));
    }

    #[test]
    fn detector_keeps_peak_across_calls() {
        let mut det = DrmDetector::new();
        det.observe(&vec![0.001f32; 1024]); // very quiet, ~ -60 dBFS
        let after_quiet = det.peak_dbfs();
        det.observe(&vec![0.5f32; 1024]); // loud, ~ -6 dBFS
        let after_loud = det.peak_dbfs();
        det.observe(&vec![0.0f32; 1024]); // silence — should not lower peak
        let after_silence = det.peak_dbfs();
        assert!(after_loud > after_quiet);
        assert_eq!(after_loud, after_silence);
    }
}
