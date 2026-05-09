//! 30-second ring buffer of 16kHz s16le PCM bytes.
//!
//! Used to replay recent audio on Soniox reconnect — if the websocket drops
//! mid-session (Wi-Fi blip / idle timeout), the reconnect loop drains this
//! ring into the new session's binary stream before resuming live capture,
//! so we don't lose the last ~30s of speech to the gap.
//!
//! The bridge thread pushes every resampled chunk; the ring auto-evicts
//! oldest chunks to stay under capacity. Chunks are stored as-pushed (each
//! one is one websocket frame) so replay is loop-free.

use std::collections::VecDeque;

const SAMPLE_RATE: usize = 16_000;
const BYTES_PER_SAMPLE: usize = 2; // s16le mono
const RING_SECONDS: usize = 30;

/// Bytes-budget for the ring window: 16kHz × 2 bytes × 30s = 960 KB.
pub const RING_CAPACITY_BYTES: usize = SAMPLE_RATE * BYTES_PER_SAMPLE * RING_SECONDS;

pub struct AudioRing {
    chunks: VecDeque<Vec<u8>>,
    total_bytes: usize,
    capacity_bytes: usize,
}

impl AudioRing {
    pub fn new() -> Self {
        Self::with_capacity(RING_CAPACITY_BYTES)
    }

    pub fn with_capacity(capacity_bytes: usize) -> Self {
        Self {
            chunks: VecDeque::new(),
            total_bytes: 0,
            capacity_bytes,
        }
    }

    /// Append a chunk and drop oldest chunks until under capacity. Always
    /// retains the just-pushed chunk (a single oversized push isn't dropped
    /// to avoid emptying the ring).
    pub fn push(&mut self, chunk: Vec<u8>) {
        self.total_bytes += chunk.len();
        self.chunks.push_back(chunk);
        while self.total_bytes > self.capacity_bytes && self.chunks.len() > 1 {
            if let Some(old) = self.chunks.pop_front() {
                self.total_bytes -= old.len();
            } else {
                break;
            }
        }
    }

    /// Clone all retained chunks for replay. Order: oldest first.
    pub fn snapshot(&self) -> Vec<Vec<u8>> {
        self.chunks.iter().cloned().collect()
    }

    pub fn total_bytes(&self) -> usize {
        self.total_bytes
    }

    pub fn len(&self) -> usize {
        self.chunks.len()
    }

    pub fn is_empty(&self) -> bool {
        self.chunks.is_empty()
    }
}

impl Default for AudioRing {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_ring_has_no_bytes() {
        let r = AudioRing::new();
        assert_eq!(r.total_bytes(), 0);
        assert!(r.is_empty());
        assert!(r.snapshot().is_empty());
    }

    #[test]
    fn under_capacity_keeps_all() {
        let mut r = AudioRing::with_capacity(100);
        r.push(vec![0; 30]);
        r.push(vec![1; 40]);
        assert_eq!(r.total_bytes(), 70);
        assert_eq!(r.len(), 2);
        let snap = r.snapshot();
        assert_eq!(snap.len(), 2);
        assert_eq!(snap[0][0], 0);
        assert_eq!(snap[1][0], 1);
    }

    #[test]
    fn over_capacity_evicts_oldest() {
        let mut r = AudioRing::with_capacity(100);
        r.push(vec![0; 50]);
        r.push(vec![1; 50]);
        r.push(vec![2; 50]); // evicts first
        assert_eq!(r.len(), 2);
        assert_eq!(r.total_bytes(), 100);
        let snap = r.snapshot();
        assert_eq!(snap[0][0], 1);
        assert_eq!(snap[1][0], 2);
    }

    #[test]
    fn oversized_single_push_is_retained() {
        // Pathological: one chunk bigger than capacity. Keep it — better to
        // replay extra than to drop the only thing we have.
        let mut r = AudioRing::with_capacity(100);
        r.push(vec![0; 200]);
        assert_eq!(r.len(), 1);
        assert_eq!(r.total_bytes(), 200);
    }

    #[test]
    fn realistic_capture_pattern_stays_bounded() {
        // 120ms s16le mono chunks at 16kHz = 3840 bytes each. After 60s of
        // capture (500 chunks pushed) the ring should hold the last 30s.
        let mut r = AudioRing::new();
        for _ in 0..500 {
            r.push(vec![0; 3840]);
        }
        assert!(r.total_bytes() <= RING_CAPACITY_BYTES);
        // 30s × ~8.33 chunks/s = ~250 chunks
        assert!(r.len() >= 240 && r.len() <= 260);
    }
}
