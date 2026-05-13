// bartleby-mic — AVAudioEngine microphone sidecar.
//
// macOS 15.x silently drops mic samples from SCKit's
// `with_captures_microphone(true)` and from cpal-on-CoreAudio even when
// the TCC mic grant is in place (verdict granted=true). AVAudioEngine
// via Apple's blessed path surfaces the standard mic prompt and
// delivers samples reliably.
//
// Wire: write 48 kHz mono float32 little-endian to stdout. The Rust
// parent (capture::mic_avengine) reads stdout in 4-byte frames and
// stereo-duplicates into the existing Opus / STT pipeline.

import Foundation
import AVFoundation

let TARGET_RATE: Double = 48_000

guard let targetFormat = AVAudioFormat(
    commonFormat: .pcmFormatFloat32,
    sampleRate: TARGET_RATE,
    channels: 1,
    interleaved: false
) else {
    FileHandle.standardError.write("[bartleby-mic] failed to build target format\n".data(using: .utf8)!)
    exit(1)
}

let engine = AVAudioEngine()
let inputNode = engine.inputNode
let inputFormat = inputNode.inputFormat(forBus: 0)

FileHandle.standardError.write(
    "[bartleby-mic] input rate=\(inputFormat.sampleRate) ch=\(inputFormat.channelCount)\n"
        .data(using: .utf8)!
)

guard inputFormat.sampleRate > 0 else {
    FileHandle.standardError.write("[bartleby-mic] input format invalid (rate=0) — mic likely not granted\n".data(using: .utf8)!)
    exit(2)
}

guard let converter = AVAudioConverter(from: inputFormat, to: targetFormat) else {
    FileHandle.standardError.write("[bartleby-mic] AVAudioConverter init failed\n".data(using: .utf8)!)
    exit(3)
}

let stdout = FileHandle.standardOutput

inputNode.installTap(onBus: 0, bufferSize: 1024, format: inputFormat) { (buffer, _) in
    let outFrames = AVAudioFrameCount(
        Double(buffer.frameLength) * TARGET_RATE / inputFormat.sampleRate
    ) + 64
    guard let outBuffer = AVAudioPCMBuffer(pcmFormat: targetFormat, frameCapacity: outFrames) else {
        return
    }

    var error: NSError? = nil
    var provided = false
    let status = converter.convert(to: outBuffer, error: &error) { _, outStatus in
        if provided {
            outStatus.pointee = .noDataNow
            return nil
        }
        provided = true
        outStatus.pointee = .haveData
        return buffer
    }

    if status == .error || error != nil {
        return
    }

    let frames = Int(outBuffer.frameLength)
    guard frames > 0, let ch0 = outBuffer.floatChannelData?[0] else { return }
    let data = Data(bytes: ch0, count: frames * MemoryLayout<Float>.size)
    stdout.write(data)
}

engine.prepare()

do {
    try engine.start()
    FileHandle.standardError.write("[bartleby-mic] engine started\n".data(using: .utf8)!)
} catch {
    FileHandle.standardError.write("[bartleby-mic] start failed: \(error)\n".data(using: .utf8)!)
    exit(4)
}

signal(SIGTERM) { _ in exit(0) }
signal(SIGINT) { _ in exit(0) }

RunLoop.main.run()
