//! macOS text injection for dictation.
//!
//! Types a string into whatever app is frontmost by synthesizing keyboard
//! events that carry the Unicode payload directly (`CGEventKeyboardSetUnicodeString`
//! via `CGEvent::set_string`) — no key codes, no ⌘V, no clipboard. This is
//! modifier-independent, which matters for push-to-talk: the user may still be
//! physically holding the hotkey's modifiers when we inject, so we also clear
//! the synthesized events' flags.
//!
//! Posting events into other apps requires the macOS **Accessibility**
//! permission; without it `CGEventPost` is silently dropped, so callers must
//! check `accessibility_trusted()` first.

#[cfg(target_os = "macos")]
mod imp {
    use core_foundation::base::TCFType;
    use core_foundation::boolean::CFBoolean;
    use core_foundation::dictionary::{CFDictionary, CFDictionaryRef};
    use core_foundation::string::{CFString, CFStringRef};
    use core_graphics::event::{CGEvent, CGEventFlags, CGEventTapLocation};
    use core_graphics::event_source::{CGEventSource, CGEventSourceStateID};

    // Inject in small chunks — a single event carrying a very long string can be
    // dropped or truncated by some apps.
    const CHUNK_CHARS: usize = 20;

    pub fn inject_text(text: &str) -> Result<(), String> {
        if text.is_empty() {
            return Ok(());
        }
        let chars: Vec<char> = text.chars().collect();
        for chunk in chars.chunks(CHUNK_CHARS) {
            let s: String = chunk.iter().collect();
            post_unicode(&s)?;
        }
        Ok(())
    }

    fn post_unicode(s: &str) -> Result<(), String> {
        // CombinedSessionState picks up the current session; the keycode (0) is
        // irrelevant once a unicode string is attached.
        let down = make_event(true)?;
        down.set_string(s);
        down.post(CGEventTapLocation::HID);

        // Post a matching keyup WITHOUT the unicode string attached. Apps that
        // insert text on keyup (rather than keydown) would otherwise double the
        // text; the bare keyup keeps the event pair well-formed without a second
        // insertion. Flags are already cleared by `make_event`.
        let up = make_event(false)?;
        up.post(CGEventTapLocation::HID);
        Ok(())
    }

    fn make_event(key_down: bool) -> Result<CGEvent, String> {
        let source = CGEventSource::new(CGEventSourceStateID::CombinedSessionState)
            .map_err(|_| "CGEventSource init failed".to_string())?;
        let event = CGEvent::new_keyboard_event(source, 0, key_down)
            .map_err(|_| "CGEvent keyboard event init failed".to_string())?;
        // Clear flags so a physically-held ⌥/⌘ (from the PTT hotkey) doesn't
        // contaminate the injected keystroke.
        event.set_flags(CGEventFlags::empty());
        Ok(event)
    }

    // ── Accessibility permission (required for CGEventPost to other apps) ──
    #[link(name = "ApplicationServices", kind = "framework")]
    extern "C" {
        fn AXIsProcessTrusted() -> bool;
        fn AXIsProcessTrustedWithOptions(options: CFDictionaryRef) -> bool;
        static kAXTrustedCheckOptionPrompt: CFStringRef;
    }

    pub fn accessibility_trusted() -> bool {
        unsafe { AXIsProcessTrusted() }
    }

    /// Triggers the system Accessibility prompt (the dialog with an "Open System
    /// Settings" button) if not yet trusted. Returns current trust state.
    pub fn prompt_accessibility() -> bool {
        unsafe {
            let key = CFString::wrap_under_get_rule(kAXTrustedCheckOptionPrompt);
            let value = CFBoolean::true_value();
            let dict = CFDictionary::from_CFType_pairs(&[(key.as_CFType(), value.as_CFType())]);
            AXIsProcessTrustedWithOptions(dict.as_concrete_TypeRef())
        }
    }
}

#[cfg(not(target_os = "macos"))]
mod imp {
    pub fn inject_text(_text: &str) -> Result<(), String> {
        Err("text injection is macOS-only".into())
    }
    pub fn accessibility_trusted() -> bool {
        false
    }
    pub fn prompt_accessibility() -> bool {
        false
    }
}

pub use imp::{accessibility_trusted, inject_text, prompt_accessibility};
