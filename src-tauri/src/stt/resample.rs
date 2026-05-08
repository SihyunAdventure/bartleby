//! 48kHz interleaved stereo f32 → 16kHz mono PCM s16le.
//!
//! `Resampler` accumulates incoming source samples (channel-averaged to mono)
//! and emits 120ms (1920-sample) chunks of s16le bytes ready for Soniox.
//!
//! Linear interpolation; aliasing acceptable for STT spike (speech <4kHz, source
//! is band-limited at 24kHz Nyquist). Production replacement = rubato or similar.

const SOURCE_RATE: f64 = 48_000.0;
const TARGET_RATE: f64 = 16_000.0;
const RATIO: f64 = SOURCE_RATE / TARGET_RATE;
pub const TARGET_CHUNK_SAMPLES: usize = 1_920; // 120ms @ 16kHz mono

pub struct Resampler {
    /// Mono-mixed source samples not yet consumed by the chunk writer.
    src_buf: Vec<f32>,
    /// Fractional position within `src_buf` for the next target sample.
    cursor: f64,
    /// 16kHz mono samples ready for s16le packing.
    target_buf: Vec<f32>,
}

impl Resampler {
    pub fn new() -> Self {
        Self {
            src_buf: Vec::with_capacity(48_000),
            cursor: 0.0,
            target_buf: Vec::with_capacity(TARGET_CHUNK_SAMPLES * 4),
        }
    }

    /// Push interleaved stereo f32 samples; returns any complete 120ms chunks
    /// as little-endian i16 byte vectors.
    pub fn push(&mut self, interleaved: &[f32]) -> Vec<Vec<u8>> {
        if interleaved.len() < 2 {
            return Vec::new();
        }
        let frames = interleaved.len() / 2;
        self.src_buf.reserve(frames);
        for i in 0..frames {
            let l = interleaved[i * 2];
            let r = interleaved[i * 2 + 1];
            self.src_buf.push((l + r) * 0.5);
        }

        // Walk the cursor through src_buf, emitting target samples while we
        // still have one src sample beyond the cursor for interpolation.
        loop {
            let idx = self.cursor as usize;
            if idx + 1 >= self.src_buf.len() {
                break;
            }
            let frac = (self.cursor - idx as f64) as f32;
            let s0 = self.src_buf[idx];
            let s1 = self.src_buf[idx + 1];
            self.target_buf.push(s0 + (s1 - s0) * frac);
            self.cursor += RATIO;
        }

        // Drop everything before cursor floor so src_buf doesn't grow without
        // bound. Adjust cursor to its new fractional position.
        let drop_n = self.cursor as usize;
        if drop_n > 0 {
            self.src_buf.drain(0..drop_n);
            self.cursor -= drop_n as f64;
        }

        // Drain whole 120ms chunks.
        let mut out = Vec::new();
        while self.target_buf.len() >= TARGET_CHUNK_SAMPLES {
            let chunk: Vec<f32> = self.target_buf.drain(0..TARGET_CHUNK_SAMPLES).collect();
            let mut bytes = Vec::with_capacity(TARGET_CHUNK_SAMPLES * 2);
            for s in chunk {
                let i = (s * i16::MAX as f32).clamp(i16::MIN as f32, i16::MAX as f32) as i16;
                bytes.extend_from_slice(&i.to_le_bytes());
            }
            out.push(bytes);
        }
        out
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_input_emits_nothing() {
        let mut r = Resampler::new();
        assert!(r.push(&[]).is_empty());
    }

    #[test]
    fn one_chunk_after_three_input_buffers() {
        let mut r = Resampler::new();
        // 120ms of source @ 48kHz = 5760 frames stereo = 11520 interleaved
        let frames = 5760usize;
        let mut interleaved = Vec::with_capacity(frames * 2);
        for i in 0..frames {
            let s = ((i as f32) * 0.001).sin() * 0.5;
            interleaved.push(s);
            interleaved.push(s);
        }
        // Feed in three roughly equal pieces.
        let third = interleaved.len() / 3;
        let chunks_a = r.push(&interleaved[..third]);
        let chunks_b = r.push(&interleaved[third..third * 2]);
        let chunks_c = r.push(&interleaved[third * 2..]);
        let total = chunks_a.len() + chunks_b.len() + chunks_c.len();
        assert!(total >= 1, "expected ≥1 chunk, got {total}");
        let bytes = chunks_a
            .into_iter()
            .chain(chunks_b)
            .chain(chunks_c)
            .next()
            .unwrap();
        assert_eq!(bytes.len(), TARGET_CHUNK_SAMPLES * 2);
    }

    #[test]
    fn channel_average_silences_anti_phase() {
        // L and R perfectly inverted should average to zero.
        let mut r = Resampler::new();
        let frames = 5760usize;
        let mut interleaved = Vec::with_capacity(frames * 2);
        for i in 0..frames {
            let s = ((i as f32) * 0.001).sin() * 0.5;
            interleaved.push(s);
            interleaved.push(-s);
        }
        let chunks = r.push(&interleaved);
        for bytes in chunks {
            for window in bytes.chunks_exact(2) {
                let v = i16::from_le_bytes([window[0], window[1]]);
                assert_eq!(v, 0, "expected silent sample after L+R cancel");
            }
        }
    }

    #[test]
    fn cursor_advances_steadily() {
        let mut r = Resampler::new();
        // 1 second of source = 48000 frames stereo. Should emit ~16000 target
        // samples = ~8 chunks of 1920.
        let frames = 48_000usize;
        let mut interleaved = Vec::with_capacity(frames * 2);
        for _ in 0..frames {
            interleaved.push(0.1);
            interleaved.push(0.1);
        }
        let chunks = r.push(&interleaved);
        // Allow ±1 chunk tolerance for boundary effects from a single push.
        assert!(
            (7..=9).contains(&chunks.len()),
            "expected ~8 chunks, got {}",
            chunks.len()
        );
    }
}
