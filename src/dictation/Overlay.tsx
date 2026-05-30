import { useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow, PhysicalPosition, LogicalSize, currentMonitor, primaryMonitor } from "@tauri-apps/api/window";
import styles from "./Overlay.module.css";

// Minimal dictation HUD — a small rounded parchment square docked at the
// bottom-center of the screen, holding the brand quill with a steady ambient
// glow (not voice-reactive). No text. Fades in on start, fades out on stop.
// Runs in its own transparent, non-focusing window (label "dictation").

const INK = "#3a2c18"; // sepia (swap to "#161310" for sumi)
// Logical size of the parchment card (small rounded square).
const CARD = 46;
// Window is larger than the card so the drifting glow particles aren't clipped.
const WIN = 120;

type Phase = "idle" | "listening" | "error";
interface DictationStatePayload { state: "listening" | "idle" }
interface DictationErrorPayload { code: string; message: string }

export default function DictationOverlay() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const hideTimerRef = useRef<number | undefined>(undefined);
  const errorTimerRef = useRef<number | undefined>(undefined);

  async function positionAndShow() {
    try {
      const win = getCurrentWindow();
      await win.setSize(new LogicalSize(WIN, WIN));
      // Position BEFORE showing so it never flashes at the wrong spot. Fall back
      // to the primary monitor if the current one can't be resolved.
      let mon = await currentMonitor();
      if (!mon) mon = await primaryMonitor();
      if (mon) {
        const scale = mon.scaleFactor || 1;
        const wPhys = WIN * scale;
        const hPhys = WIN * scale;
        const x = mon.position.x + Math.round((mon.size.width - wPhys) / 2);
        const y = mon.position.y + mon.size.height - hPhys - Math.round(28 * scale);
        await win.setPosition(new PhysicalPosition(x, y));
      }
      await win.setAlwaysOnTop(true);
      await win.show();
    } catch (e) {
      console.error("[dictation overlay] positionAndShow failed", e);
    }
  }

  function scheduleHide(win: ReturnType<typeof getCurrentWindow>, delay: number) {
    if (hideTimerRef.current !== undefined) window.clearTimeout(hideTimerRef.current);
    setPhase("idle");
    hideTimerRef.current = window.setTimeout(() => void win.hide(), delay);
  }

  useEffect(() => {
    let subs: Promise<() => void>[] = [];
    try {
      const win = getCurrentWindow();
      subs = [
        listen<DictationStatePayload>("dictation_state", (e) => {
          if (e.payload.state === "listening") {
            if (hideTimerRef.current !== undefined) window.clearTimeout(hideTimerRef.current);
            setErrorMsg("");
            // Show while still faded out, then flip to "listening" next frame so
            // the opacity transition actually animates (no pop-in).
            setPhase("idle");
            void positionAndShow().then(() => {
              requestAnimationFrame(() => requestAnimationFrame(() => setPhase("listening")));
            });
          } else {
            scheduleHide(win, 280); // 280ms = CSS fade-out duration
          }
        }),
        listen<DictationErrorPayload>("dictation_error", (e) => {
          setErrorMsg(e.payload.message); setPhase("error");
          void positionAndShow();
          if (errorTimerRef.current !== undefined) window.clearTimeout(errorTimerRef.current);
          errorTimerRef.current = window.setTimeout(() => scheduleHide(win, 280), 3200);
        }),
      ];
    } catch {
      /* browser QA */
    }
    return () => {
      subs.forEach((p) => p.then((u) => u()).catch(() => {}));
      if (hideTimerRef.current !== undefined) window.clearTimeout(hideTimerRef.current);
      if (errorTimerRef.current !== undefined) window.clearTimeout(errorTimerRef.current);
    };
  }, []);

  return (
    <div className={styles.dock} style={{ ["--card" as string]: `${CARD}px` }}>
      <div className={styles.card} data-phase={phase} style={{ ["--ink" as string]: INK }}>
        {phase === "error" ? (
          <span className={styles.error}>{errorMsg}</span>
        ) : (
          <>
            {/* Ambient glow particles drifting gently outward (steady). */}
            <span className={styles.aura} aria-hidden="true">
              <span className={`${styles.p} ${styles.p1}`} />
              <span className={`${styles.p} ${styles.p2}`} />
              <span className={`${styles.p} ${styles.p3}`} />
              <span className={`${styles.p} ${styles.p4}`} />
              <span className={`${styles.p} ${styles.p5}`} />
              <span className={`${styles.p} ${styles.p6}`} />
              <span className={`${styles.p} ${styles.p7}`} />
              <span className={`${styles.p} ${styles.p8}`} />
            </span>
            <span className={styles.halo} aria-hidden="true" />
            {/* The brand quill (same art as the app icon, sepia silhouette). */}
            <img className={styles.quill} src="/quill.png" width="30" height="30" alt="" aria-hidden="true" />
          </>
        )}
      </div>
    </div>
  );
}
