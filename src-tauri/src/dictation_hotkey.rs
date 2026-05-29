//! Hold-Fn (🌐 globe key) push-to-talk trigger for dictation.
//!
//! The Fn/globe key can't be a Carbon/`global-hotkey` global shortcut —
//! global-hotkey needs a non-modifier key, and Fn is a modifier. Instead we
//! install a passive `CGEventTap` that listens for `FlagsChanged` events and
//! watches the **Secondary-Fn** flag (`CGEventFlagSecondaryFn`, mask 0x800000).
//! On the OFF→ON transition we start dictation; on ON→OFF we stop it. The tap
//! is a listener (returns the event unmodified) so it never swallows Fn.
//!
//! This also fixes the prior ⌃⌥D bug where the Carbon "Released" event was
//! unreliable and left the "받아쓰는 중" overlay stuck — FlagsChanged gives us a
//! reliable release edge.
//!
//! Event taps require the macOS **Accessibility** permission (same as injection
//! in `inject.rs`). If tap creation fails (permission not yet granted) we log
//! and return gracefully; dictation simply won't trigger until the user grants
//! Accessibility and relaunches.

#[cfg(target_os = "macos")]
mod imp {
    use std::cell::Cell;

    use core_foundation::runloop::{kCFRunLoopCommonModes, CFRunLoop};
    use core_graphics::event::{
        CGEventFlags, CGEventTap, CGEventTapLocation, CGEventTapOptions, CGEventTapPlacement,
        CGEventType,
    };

    use crate::dictation;

    /// Install the Fn-key push-to-talk listener. Spawns a dedicated thread that
    /// owns a `CGEventTap` and runs its CFRunLoop forever. Called once from
    /// `setup()`.
    pub fn start_fn_listener(app: tauri::AppHandle) {
        std::thread::spawn(move || {
            // Previous Fn state, read/written only on this runloop thread. The
            // tap callback is `Fn` (not `FnMut`), so we need interior mutability;
            // `Cell` is enough since the closure only runs on this thread.
            let prev_fn = Cell::new(false);

            // Build the tap on THIS thread so it binds to this thread's runloop.
            // Session-level location, default (active) options — we still return
            // the event unmodified, so it behaves as a passive listener.
            let tap = match CGEventTap::new(
                CGEventTapLocation::Session,
                CGEventTapPlacement::HeadInsertEventTap,
                CGEventTapOptions::Default,
                vec![CGEventType::FlagsChanged],
                move |_proxy, _etype, event| {
                    let fn_down = event
                        .get_flags()
                        .contains(CGEventFlags::CGEventFlagSecondaryFn);
                    let was_down = prev_fn.get();
                    if fn_down && !was_down {
                        prev_fn.set(true);
                        dictation::start(&app);
                    } else if !fn_down && was_down {
                        prev_fn.set(false);
                        dictation::stop(&app);
                    }
                    // Passive listener — pass the event through untouched so we
                    // never swallow Fn.
                    None
                },
            ) {
                Ok(tap) => tap,
                Err(()) => {
                    eprintln!(
                        "[dictation-hotkey] CGEventTap creation failed — Accessibility \
                         permission is likely not granted. Grant it in System Settings \
                         and relaunch Bartleby to enable Fn(🌐) push-to-talk dictation."
                    );
                    return;
                }
            };

            // Wire the tap into this thread's runloop and run it forever. `tap`
            // and `source` are locals that outlive `run_current()` (it blocks),
            // so the tap stays live.
            let current = CFRunLoop::get_current();
            let source = match tap.mach_port.create_runloop_source(0) {
                Ok(s) => s,
                Err(()) => {
                    eprintln!("[dictation-hotkey] failed to create runloop source for event tap");
                    return;
                }
            };
            unsafe {
                current.add_source(&source, kCFRunLoopCommonModes);
            }
            tap.enable();
            println!("[dictation-hotkey] Fn(🌐) push-to-talk listener active");

            // NOTE: macOS may auto-disable a tap on timeout
            // (kCGEventTapDisabledByTimeout); our callback only spawns work and
            // returns immediately, so that's unlikely. If it ever surfaces as a
            // dead trigger, re-enable on that event type here.
            CFRunLoop::run_current();
        });
    }
}

#[cfg(not(target_os = "macos"))]
mod imp {
    pub fn start_fn_listener(_app: tauri::AppHandle) {}
}

pub use imp::start_fn_listener;
