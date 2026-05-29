import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import styles from "./Overlay.module.css";

// Minimal push-to-talk dictation HUD. Runs in its own borderless, transparent,
// non-focusing window (label "dictation", see tauri.conf.json). It shows itself
// on `dictation_state: listening` and hides on `idle`, so the user's target app
// keeps keyboard focus and the injected text lands there — the window is
// configured `focus: false` so showing it never steals focus.

type Phase = "idle" | "listening" | "error";

interface DictationStatePayload { state: "listening" | "idle" }
interface DictationErrorPayload { code: string; message: string }
interface SttPayload { text: string }

export default function DictationOverlay() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [text, setText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Guard: outside the Tauri runtime (e.g. a plain browser during QA) these
    // APIs throw. The HUD still renders; it just won't wire up live events.
    let errorTimer: number | undefined;
    let subs: Promise<() => void>[] = [];
    try {
      const win = getCurrentWindow();
      subs = [
        listen<DictationStatePayload>("dictation_state", (e) => {
          if (e.payload.state === "listening") {
            setText("");
            setErrorMsg("");
            setPhase("listening");
            void win.show();
          } else {
            setPhase("idle");
            void win.hide();
          }
        }),
        // Live preview while speaking — partials replace the line.
        listen<SttPayload>("stt_partial", (e) => setText(e.payload.text)),
        listen<DictationErrorPayload>("dictation_error", (e) => {
          setErrorMsg(e.payload.message);
          setPhase("error");
          void win.show();
          // Auto-dismiss the error after a few seconds.
          errorTimer = window.setTimeout(() => void win.hide(), 4000);
        }),
      ];
    } catch {
      // Not in the Tauri runtime (e.g. plain-browser QA) — render only.
    }

    return () => {
      subs.forEach((p) => p.then((un) => un()).catch(() => {}));
      if (errorTimer) window.clearTimeout(errorTimer);
    };
  }, []);

  return (
    <div className={styles.hud} data-phase={phase}>
      {phase === "error" ? (
        <span className={styles.error}>{errorMsg}</span>
      ) : (
        <>
          <span className={styles.dot} />
          <span className={styles.text}>{text || "받아쓰는 중…"}</span>
        </>
      )}
    </div>
  );
}
