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
    use std::cell::{Cell, OnceCell};
    use std::rc::Rc;
    use std::sync::mpsc;

    use core_foundation::runloop::{kCFRunLoopCommonModes, CFRunLoop};
    use core_graphics::event::{
        CGEventFlags, CGEventTap, CGEventTapLocation, CGEventTapOptions, CGEventTapPlacement,
        CGEventType,
    };

    use crate::dictation;

    /// Command sent from the (fast, non-blocking) tap callback to the serialized
    /// worker thread. `dictation::start` blocks on mic readiness, so it must not
    /// run on the runloop thread (a slow start would stall the tap and trip
    /// `TapDisabledByTimeout`).
    enum DictCmd {
        Start,
        Stop,
    }

    /// Install the Fn-key push-to-talk listener. Spawns a dedicated thread that
    /// owns a `CGEventTap` and runs its CFRunLoop forever. Called once from
    /// `setup()`.
    pub fn start_fn_listener(app: tauri::AppHandle) {
        std::thread::spawn(move || {
            // Serialized worker: the tap callback only `send`s Start/Stop and
            // returns immediately, keeping the runloop responsive. The worker
            // processes commands in order, so a fast down→up can't run Stop
            // before Start finishes (which a thread-per-call would race into a
            // stuck session). `app` moves into the worker; the callback gets none.
            let (cmd_tx, cmd_rx) = mpsc::channel::<DictCmd>();
            std::thread::spawn(move || {
                while let Ok(cmd) = cmd_rx.recv() {
                    match cmd {
                        DictCmd::Start => dictation::start(&app),
                        DictCmd::Stop => dictation::stop(&app),
                    }
                }
            });

            // Previous Fn state, read/written only on this runloop thread. The
            // tap callback is `Fn` (not `FnMut`), so we need interior mutability;
            // `Cell` is enough since the closure only runs on this thread.
            let prev_fn = Cell::new(false);

            // Self-reference so the callback can re-enable the tap after macOS
            // disables it (timeout / user input). The tap doesn't exist yet when
            // the closure is defined, and the crate's `CGEventTapEnable` FFI is
            // private — so the callback reaches the tap through this cell, which
            // we populate right after creation. Single-threaded → `Rc`/`OnceCell`
            // are safe here. The Rc cycle never frees the tap, but `run_current()`
            // blocks forever so the leak is irrelevant.
            let tap_cell: Rc<OnceCell<CGEventTap>> = Rc::new(OnceCell::new());
            let cb_cell = Rc::clone(&tap_cell);

            // Build the tap on THIS thread so it binds to this thread's runloop.
            // Session-level location, default (active) options — we still return
            // the event unmodified, so it behaves as a passive listener.
            let tap = match CGEventTap::new(
                CGEventTapLocation::Session,
                CGEventTapPlacement::HeadInsertEventTap,
                CGEventTapOptions::Default,
                vec![CGEventType::FlagsChanged],
                move |_proxy, etype, event| {
                    // macOS disables the tap on timeout or on certain user input;
                    // re-enable it so dictation keeps working instead of going
                    // silently dead.
                    if matches!(
                        etype,
                        CGEventType::TapDisabledByTimeout
                            | CGEventType::TapDisabledByUserInput
                    ) {
                        if let Some(tap) = cb_cell.get() {
                            tap.enable();
                        }
                        return None;
                    }

                    let fn_down = event
                        .get_flags()
                        .contains(CGEventFlags::CGEventFlagSecondaryFn);
                    let was_down = prev_fn.get();
                    if fn_down && !was_down {
                        prev_fn.set(true);
                        let _ = cmd_tx.send(DictCmd::Start);
                    } else if !fn_down && was_down {
                        prev_fn.set(false);
                        let _ = cmd_tx.send(DictCmd::Stop);
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

            // Publish the tap into the cell so the callback can re-enable it.
            let _ = tap_cell.set(tap);
            let tap = tap_cell.get().expect("tap just set");

            // Wire the tap into this thread's runloop and run it forever. `tap`
            // (held by `tap_cell`) and `source` outlive `run_current()` (it
            // blocks), so the tap stays live.
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

            CFRunLoop::run_current();
        });
    }
}

#[cfg(not(target_os = "macos"))]
mod imp {
    pub fn start_fn_listener(_app: tauri::AppHandle) {}
}

pub use imp::start_fn_listener;
