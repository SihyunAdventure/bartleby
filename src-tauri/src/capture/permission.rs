//! macOS TCC microphone permission request.
//!
//! cpal's CoreAudio backend opens an input stream without going through any
//! AVFoundation entry point, so macOS never surfaces the standard mic prompt
//! and just hands cpal an empty / silent stream.
//! `AVCaptureDevice.requestAccessForMediaType:completionHandler:` is the
//! documented Apple API to force the prompt; calling it once at startup
//! registers the bundle in Privacy → Microphone.

#[cfg(target_os = "macos")]
pub fn request_microphone_access() {
    use block2::RcBlock;
    use objc2::runtime::Bool;
    use objc2_av_foundation::{AVCaptureDevice, AVMediaTypeAudio};

    // SAFETY: `AVMediaTypeAudio` is a global NSString constant; safe to read
    // once AVFoundation is dyld-loaded (which Tauri's main has triggered by
    // the time `run()` is called).
    let media_type = match unsafe { AVMediaTypeAudio } {
        Some(t) => t,
        None => {
            eprintln!("[mic permission] AVMediaTypeAudio is null — AVFoundation not loaded");
            return;
        }
    };

    // Completion handler is invoked on an arbitrary dispatch queue once the
    // user has answered. We only log here; the actual mic capture path
    // (cpal) keeps polling its own callbacks and starts seeing real audio
    // automatically once TCC flips to allow.
    let handler = RcBlock::new(move |granted: Bool| {
        println!(
            "[mic permission] AVCaptureDevice verdict: granted={}",
            granted.as_bool()
        );
    });

    unsafe {
        AVCaptureDevice::requestAccessForMediaType_completionHandler(media_type, &handler);
    }
    println!(
        "[mic permission] requestAccessForMediaType_completionHandler issued — \
         macOS may surface the prompt"
    );
}

#[cfg(not(target_os = "macos"))]
pub fn request_microphone_access() {}
