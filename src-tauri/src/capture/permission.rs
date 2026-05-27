//! macOS TCC recording permission probes and requests.
//!
//! cpal's CoreAudio backend opens an input stream without going through any
//! AVFoundation entry point, so macOS never surfaces the standard mic prompt
//! and just hands cpal an empty / silent stream.
//! `AVCaptureDevice.requestAccessForMediaType:completionHandler:` is the
//! documented Apple API to force the prompt; onboarding calls it explicitly so
//! the first launch can request permissions step by step.

#[derive(Clone, Copy, Debug, serde::Serialize)]
#[serde(rename_all = "snake_case")]
pub enum PermissionState {
    Granted,
    NotDetermined,
    Denied,
    Restricted,
    Unknown,
}

#[derive(Clone, Copy, Debug, serde::Serialize)]
pub struct RecordingPermissionStatus {
    pub microphone: PermissionState,
    pub screen_recording: PermissionState,
}

impl PermissionState {
    pub fn as_label(self) -> &'static str {
        match self {
            PermissionState::Granted => "granted",
            PermissionState::NotDetermined => "not determined",
            PermissionState::Denied => "denied",
            PermissionState::Restricted => "restricted",
            PermissionState::Unknown => "unknown",
        }
    }
}

impl RecordingPermissionStatus {
    pub fn ready(self) -> bool {
        matches!(self.microphone, PermissionState::Granted)
            && matches!(self.screen_recording, PermissionState::Granted)
    }

    pub fn error_message(self) -> String {
        format!(
            "Recording permissions are missing (Microphone: {}, Screen Recording: {}). Open the first-run checklist or macOS System Settings, enable both permissions for Bartleby, then fully quit and reopen Bartleby if Screen Recording was just changed.",
            self.microphone.as_label(),
            self.screen_recording.as_label(),
        )
    }
}

#[cfg(target_os = "macos")]
fn audio_media_type() -> Option<&'static objc2_av_foundation::AVMediaType> {
    // SAFETY: `AVMediaTypeAudio` is a global NSString constant; safe to read
    // once AVFoundation is dyld-loaded (which Tauri has done by the time
    // the frontend can invoke these commands).
    unsafe { objc2_av_foundation::AVMediaTypeAudio }
}

#[cfg(target_os = "macos")]
pub fn microphone_status() -> PermissionState {
    use objc2_av_foundation::{AVAuthorizationStatus, AVCaptureDevice};

    let Some(media_type) = audio_media_type() else {
        eprintln!("[mic permission] AVMediaTypeAudio is null — AVFoundation not loaded");
        return PermissionState::Unknown;
    };

    let status = unsafe { AVCaptureDevice::authorizationStatusForMediaType(media_type) };
    match status {
        AVAuthorizationStatus::Authorized => PermissionState::Granted,
        AVAuthorizationStatus::NotDetermined => PermissionState::NotDetermined,
        AVAuthorizationStatus::Denied => PermissionState::Denied,
        AVAuthorizationStatus::Restricted => PermissionState::Restricted,
        _ => PermissionState::Unknown,
    }
}

#[cfg(target_os = "macos")]
pub fn request_microphone_access() {
    use block2::RcBlock;
    use objc2::runtime::Bool;
    use objc2_av_foundation::AVCaptureDevice;

    let media_type = match audio_media_type() {
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

#[cfg(target_os = "macos")]
#[link(name = "CoreGraphics", kind = "framework")]
extern "C" {
    fn CGPreflightScreenCaptureAccess() -> bool;
    fn CGRequestScreenCaptureAccess() -> bool;
}

#[cfg(target_os = "macos")]
pub fn screen_recording_status() -> PermissionState {
    // CoreGraphics exposes only a granted/not-granted preflight. Denied vs.
    // not-yet-requested is not distinguishable here, so the UI pairs this with
    // an explicit request/open-settings path.
    if unsafe { CGPreflightScreenCaptureAccess() } {
        PermissionState::Granted
    } else {
        PermissionState::NotDetermined
    }
}

#[cfg(target_os = "macos")]
pub fn request_screen_recording_access() -> PermissionState {
    if unsafe { CGRequestScreenCaptureAccess() } {
        PermissionState::Granted
    } else {
        screen_recording_status()
    }
}

#[cfg(target_os = "macos")]
pub fn recording_status() -> RecordingPermissionStatus {
    RecordingPermissionStatus {
        microphone: microphone_status(),
        screen_recording: screen_recording_status(),
    }
}

#[cfg(target_os = "macos")]
pub fn recording_ready() -> bool {
    recording_status().ready()
}

#[cfg(not(target_os = "macos"))]
pub fn microphone_status() -> PermissionState {
    PermissionState::Granted
}

#[cfg(not(target_os = "macos"))]
pub fn request_microphone_access() {}

#[cfg(not(target_os = "macos"))]
pub fn screen_recording_status() -> PermissionState {
    PermissionState::Granted
}

#[cfg(not(target_os = "macos"))]
pub fn request_screen_recording_access() -> PermissionState {
    PermissionState::Granted
}

#[cfg(not(target_os = "macos"))]
pub fn recording_status() -> RecordingPermissionStatus {
    RecordingPermissionStatus {
        microphone: PermissionState::Granted,
        screen_recording: PermissionState::Granted,
    }
}

#[cfg(not(target_os = "macos"))]
pub fn recording_ready() -> bool {
    true
}
