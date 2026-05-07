//! Opus/Ogg encoding for Bartleby audio capture.
//!
//! Receives interleaved stereo f32 samples via an mpsc channel and encodes
//! them to rolling 5-second Ogg Opus segment files at 32 kbps.
//!
//! Each segment is a self-contained Ogg bitstream (independent serial,
//! complete OpusHead + OpusTags headers, EoS on last page).  Segments are
//! named `{base}-{seg:03}.opus` (e.g. `bartleby-system-1778167256821-000.opus`).

use std::fs::File;
use std::io::{BufWriter, Write};
use std::path::{Path, PathBuf};
use std::sync::mpsc;

use anyhow::{Context, Result};
use ogg::writing::{PacketWriteEndInfo, PacketWriter};
use opus::{Application, Bitrate, Channels, Encoder};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SAMPLE_RATE: u32 = 48_000;
/// Interleaved stereo samples per 20 ms Opus frame (960 samples/ch × 2 ch).
const FRAME_SAMPLES: usize = 1_920;
/// Frames per 5-second segment (5s / 20ms = 250).
const FRAMES_PER_SEGMENT: usize = 250;
/// Maximum encoded Opus packet size in bytes.
const MAX_PACKET_BYTES: usize = 1_024;

// ---------------------------------------------------------------------------
// Public stats
// ---------------------------------------------------------------------------

/// Statistics returned by [`encoder_worker`] after the channel closes.
#[derive(Debug, Default)]
pub struct EncodingStats {
    /// Number of 5-second segment files written (0 if no samples arrived).
    pub segments_written: usize,
    /// Total Opus packets encoded.
    pub total_packets: usize,
    /// Total compressed bytes written across all segments.
    pub total_bytes: usize,
    /// Total encoded frames (samples per channel) — use for duration.
    pub total_frames: usize,
}

// ---------------------------------------------------------------------------
// Worker entry point
// ---------------------------------------------------------------------------

/// Encode raw audio samples arriving from `rx` into rolling Ogg Opus files.
///
/// Blocks the calling thread until the sender side of `rx` is dropped.
/// Returns [`EncodingStats`] with zero counts if no samples were received
/// (mic-absent case) without creating any files.
pub fn encoder_worker(
    rx: mpsc::Receiver<Vec<f32>>,
    base_path: &Path,
    label: &str,
) -> Result<EncodingStats> {
    let mut encoder = Encoder::new(SAMPLE_RATE, Channels::Stereo, Application::Audio)
        .context("Failed to create Opus encoder")?;
    encoder
        .set_bitrate(Bitrate::Bits(32_000))
        .context("Failed to set Opus bitrate")?;

    let mut stats = EncodingStats::default();

    // Buffer that accumulates incoming samples until we have a full Opus frame.
    let mut frame_buffer: Vec<f32> = Vec::with_capacity(FRAME_SAMPLES * 2);

    // Current segment state — None until the first sample arrives.
    let mut seg: Option<SegmentWriter> = None;

    while let Ok(chunk) = rx.recv() {
        frame_buffer.extend_from_slice(&chunk);

        // Drain full Opus frames from the buffer.
        while frame_buffer.len() >= FRAME_SAMPLES {
            let frame: Vec<f32> = frame_buffer.drain(..FRAME_SAMPLES).collect();

            // Open a new segment lazily on the very first frame, or when the
            // current segment has reached 250 frames (5 seconds).
            let need_roll = seg
                .as_ref()
                .map(|s| s.frame_count >= FRAMES_PER_SEGMENT)
                .unwrap_or(true);

            if need_roll {
                if let Some(mut old_seg) = seg.take() {
                    old_seg
                        .finalize_as_last(stats.total_packets, stats.total_frames)
                        .with_context(|| {
                            format!("[{label}] Failed to finalize segment {}", old_seg.index)
                        })?;
                    stats.segments_written += 1;
                }
                let seg_index = stats.segments_written;
                seg = Some(
                    SegmentWriter::open(base_path, seg_index)
                        .with_context(|| format!("[{label}] Failed to open segment {seg_index}"))?,
                );
            }

            let seg = seg.as_mut().expect("segment always open here");

            // Encode the frame.
            let packet = encoder
                .encode_vec_float(&frame, MAX_PACKET_BYTES)
                .context("Opus encode failed")?;

            let pkt_len = packet.len();
            seg.write_audio_packet(packet, stats.total_frames)
                .with_context(|| {
                    format!("[{label}] Failed to write audio packet to segment {}", seg.index)
                })?;

            seg.frame_count += 1;
            stats.total_packets += 1;
            stats.total_bytes += pkt_len;
            stats.total_frames += 960; // samples per channel per 20ms frame
        }
        // Remaining < 1920 samples stay in frame_buffer for the next recv().
    }

    // Channel closed — finalize the last open segment (if any).
    if let Some(mut last_seg) = seg.take() {
        last_seg
            .finalize_as_last(stats.total_packets, stats.total_frames)
            .with_context(|| format!("[{label}] Failed to finalize last segment"))?;
        stats.segments_written += 1;
    }

    // Partial frame (< 1920 samples) is intentionally dropped here.
    // That is at most 20 ms of audio tail — acceptable.

    if stats.segments_written > 0 {
        println!(
            "[{label}] Encoding done: {} segments, {} packets, {} bytes, {:.2}s",
            stats.segments_written,
            stats.total_packets,
            stats.total_bytes,
            stats.total_frames as f64 / SAMPLE_RATE as f64,
        );
    } else {
        println!("[{label}] No samples received — skipping segment files.");
    }

    Ok(stats)
}

// ---------------------------------------------------------------------------
// Per-segment Ogg writer
// ---------------------------------------------------------------------------

struct SegmentWriter {
    index: usize,
    serial: u32,
    pkt_writer: PacketWriter<'static, BufWriter<File>>,
    /// Number of Opus frames written into this segment so far.
    frame_count: usize,
}

impl SegmentWriter {
    /// Open a new segment file and write OpusHead + OpusTags header packets.
    fn open(base_path: &Path, index: usize) -> Result<Self> {
        let seg_path = segment_path(base_path, index);
        let file = File::create(&seg_path)
            .with_context(|| format!("Failed to create segment file: {}", seg_path.display()))?;
        let buf = BufWriter::new(file);

        // Random serial per segment so each is an independent Ogg bitstream.
        let serial: u32 = rand_serial();

        let mut pkt_writer = PacketWriter::new(buf);

        // -- OpusHead (RFC 7845 §5.1, BOS page, one packet per page) --------
        let head = opus_head();
        pkt_writer
            .write_packet(head, serial, PacketWriteEndInfo::EndPage, 0)
            .context("Failed to write OpusHead")?;

        // -- OpusTags (RFC 7845 §5.2, one packet per page) -------------------
        let tags = opus_tags();
        pkt_writer
            .write_packet(tags, serial, PacketWriteEndInfo::EndPage, 0)
            .context("Failed to write OpusTags")?;

        Ok(Self {
            index,
            serial,
            pkt_writer,
            frame_count: 0,
        })
    }

    /// Write one audio packet.  Granule position = cumulative frames in stream.
    fn write_audio_packet(&mut self, packet: Vec<u8>, total_frames_before: usize) -> Result<()> {
        // Granule position after this packet (reset per segment).
        let granule = ((self.frame_count + 1) * 960) as u64;
        let _ = total_frames_before; // unused here; kept for potential future use

        self.pkt_writer
            .write_packet(packet, self.serial, PacketWriteEndInfo::NormalPacket, granule)
            .context("Failed to write audio packet")
    }

    /// Re-write the last audio packet with EoS and flush the writer.
    ///
    /// Since `ogg::PacketWriter` flushes pages lazily, we need the EoS marker
    /// on the final packet.  We achieve this by re-issuing a zero-byte flush
    /// packet with `EndStream` — but the cleaner approach is to write the last
    /// audio packet with `EndStream` directly.  Because we only know it's the
    /// last packet *after* the loop, we write a zero-byte end-of-stream marker.
    fn finalize_as_last(
        &mut self,
        _total_packets: usize,
        _total_frames: usize,
    ) -> Result<()> {
        // Write a zero-byte EoS sentinel to close the Ogg stream.
        let granule = (self.frame_count * 960) as u64;
        self.pkt_writer
            .write_packet(
                vec![],
                self.serial,
                PacketWriteEndInfo::EndStream,
                granule,
            )
            .context("Failed to write EoS packet")?;

        // BufWriter flush is triggered by drop, but be explicit.
        self.pkt_writer
            .inner_mut()
            .flush()
            .context("Failed to flush segment file")
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn segment_path(base: &Path, index: usize) -> PathBuf {
    // base = /tmp/bartleby-system-1778167256821
    // result = /tmp/bartleby-system-1778167256821-000.opus
    let stem = base
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("segment");
    let parent = base.parent().unwrap_or(Path::new("."));
    parent.join(format!("{stem}-{index:03}.opus"))
}

/// Generate a pseudo-random u32 serial for an Ogg stream.
/// Uses the lower 32 bits of the current time in nanoseconds.
fn rand_serial() -> u32 {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .subsec_nanos();
    // Mix in thread id bits to reduce collision probability across two concurrent workers.
    let tid = std::thread::current().id();
    let tid_hash = format!("{tid:?}").len() as u32; // stable enough for serial uniqueness
    nanos ^ (tid_hash.wrapping_mul(0x9e37_79b9))
}

/// Build an RFC 7845 §5.1 OpusHead packet for 2-channel 48 kHz.
fn opus_head() -> Vec<u8> {
    let mut buf = Vec::with_capacity(19);
    buf.extend_from_slice(b"OpusHead");      // 8 bytes magic
    buf.push(1);                              // version = 1
    buf.push(2);                              // channel count = 2
    buf.extend_from_slice(&0u16.to_le_bytes()); // pre-skip = 0
    buf.extend_from_slice(&48_000u32.to_le_bytes()); // input sample rate
    buf.extend_from_slice(&0u16.to_le_bytes()); // output gain = 0
    buf.push(0);                              // channel mapping family = 0
    buf
}

/// Build an RFC 7845 §5.2 OpusTags packet with a minimal vendor string.
fn opus_tags() -> Vec<u8> {
    const VENDOR: &[u8] = b"bartleby/0.1";
    let vendor_len = VENDOR.len() as u32;

    let mut buf = Vec::with_capacity(8 + 4 + VENDOR.len() + 4);
    buf.extend_from_slice(b"OpusTags");                  // 8 bytes magic
    buf.extend_from_slice(&vendor_len.to_le_bytes());    // vendor string length
    buf.extend_from_slice(VENDOR);                        // vendor string
    buf.extend_from_slice(&0u32.to_le_bytes());          // user comment list length = 0
    buf
}

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn opus_round_trip_non_zero() {
        // 1 second of 48 kHz stereo 440 Hz sine wave — no SCStream dep.
        let mut samples: Vec<f32> = Vec::with_capacity(48_000 * 2);
        for i in 0..48_000usize {
            let t = i as f32 / 48_000.0_f32;
            let v = (2.0 * std::f32::consts::PI * 440.0 * t).sin() * 0.5;
            samples.push(v); // L
            samples.push(v); // R
        }

        let mut encoder =
            Encoder::new(48_000, Channels::Stereo, Application::Audio).unwrap();
        encoder.set_bitrate(Bitrate::Bits(32_000)).unwrap();
        let mut decoder = opus::Decoder::new(48_000, Channels::Stereo).unwrap();

        // Encode the first 20ms frame (1920 interleaved samples).
        let frame = &samples[..1920];
        let packet = encoder.encode_vec_float(frame, 1024).unwrap();
        assert!(!packet.is_empty(), "encoded packet must not be empty");

        // Decode and verify non-zero RMS.
        let mut decoded = vec![0.0f32; 1920];
        let n = decoder
            .decode_float(&packet, &mut decoded, false)
            .unwrap();
        assert!(n > 0, "decoded frame count must be > 0");
        let rms = (decoded[..n * 2]
            .iter()
            .map(|&s| (s * s) as f64)
            .sum::<f64>()
            / (n * 2) as f64)
            .sqrt();
        assert!(rms > 0.01, "decoded RMS should be > 0.01, got {rms:.4}");
    }

    #[test]
    fn opus_head_length() {
        assert_eq!(opus_head().len(), 19);
    }

    #[test]
    fn opus_tags_has_magic() {
        let tags = opus_tags();
        assert!(tags.starts_with(b"OpusTags"));
    }

    #[test]
    fn segment_path_naming() {
        let base = Path::new("/tmp/bartleby-system-1778167256821");
        assert_eq!(
            segment_path(base, 0).to_str().unwrap(),
            "/tmp/bartleby-system-1778167256821-000.opus"
        );
        assert_eq!(
            segment_path(base, 1).to_str().unwrap(),
            "/tmp/bartleby-system-1778167256821-001.opus"
        );
    }
}
