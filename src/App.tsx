import { lazy, Suspense, useEffect, useState, type CSSProperties } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import Settings from "./settings/Settings";
import { loadPrefs, listenToPrefs, type CaptionMode } from "./settings/prefs";
import "./App.css";

const Gallery = lazy(() => import("./gallery/Gallery"));

const params = new URLSearchParams(window.location.search);
const isOverlay = params.has("overlay");
const isGallery = params.has("gallery");

interface DrmStatusPayload {
  drm_blocked: boolean;
  peak_dbfs: number;
}

interface SttPartialPayload {
  text: string;
  language: string | null;
}

interface SttFinalPayload {
  text: string;
  language: string | null;
}

interface SttErrorPayload {
  code: string | null;
  message: string;
}

interface TranslationPartialPayload {
  original: string;
  translation: string;
}

interface TranslationFinalPayload {
  original: string;
  translation: string;
}

interface TranslationErrorPayload {
  message: string;
  original: string;
}

// Overlay caption window — keep last N chars of running final transcript so
// the surface doesn't grow unbounded. §11 LiveCaption gallery will tune this.
const FINAL_WINDOW_CHARS = 220;

function Overlay() {
  // Drag wiring requires three pieces working together (any one missing →
  // silent no-op): (1) `data-tauri-drag-region` attribute below, (2)
  // `core:window:allow-start-dragging` capability + overlay listed in
  // capabilities/default.json, (3) `acceptFirstMouse: true` on the overlay
  // window in tauri.conf.json so inactive-state first click reaches drag.js.
  const [drmBlocked, setDrmBlocked] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [partialText, setPartialText] = useState("");
  const [sttError, setSttError] = useState<string | null>(null);
  const [koText, setKoText] = useState("");
  const [koPartial, setKoPartial] = useState("");
  const [translationError, setTranslationError] = useState<string | null>(null);

  // Prefs — wired: caption_mode, overlay_opacity, caption_font_size.
  const [captionMode, setCaptionMode] = useState<CaptionMode>(() => loadPrefs().caption_mode);
  const [overlayOpacity, setOverlayOpacity] = useState(() => loadPrefs().overlay_opacity);
  const [captionFontSize, setCaptionFontSize] = useState(() => loadPrefs().caption_font_size);

  useEffect(() => {
    const unlistenPromise = listenToPrefs((p) => {
      setCaptionMode(p.caption_mode);
      setOverlayOpacity(p.overlay_opacity);
      setCaptionFontSize(p.caption_font_size);
    });
    return () => {
      unlistenPromise.then((fn) => fn());
    };
  }, []);

  useEffect(() => {
    const subs = [
      listen<DrmStatusPayload>("drm_status", (event) => {
        setDrmBlocked(event.payload.drm_blocked);
      }),
      listen<SttFinalPayload>("stt_final", (event) => {
        setFinalText((prev) => {
          const joined = (prev + event.payload.text).replace(/\s+/g, " ").trimStart();
          return joined.length > FINAL_WINDOW_CHARS
            ? joined.slice(-FINAL_WINDOW_CHARS)
            : joined;
        });
        setPartialText("");
        setSttError(null);
      }),
      listen<SttPartialPayload>("stt_partial", (event) => {
        setPartialText(event.payload.text);
        setSttError(null);
      }),
      listen<SttErrorPayload>("stt_error", (event) => {
        setSttError(event.payload.message);
      }),
      listen<TranslationPartialPayload>("translation_partial", (event) => {
        setKoPartial(event.payload.translation);
        setTranslationError(null);
      }),
      listen<TranslationFinalPayload>("translation_final", (event) => {
        setKoText((prev) => {
          const joined = (prev + " " + event.payload.translation).trim();
          return joined.length > FINAL_WINDOW_CHARS
            ? joined.slice(-FINAL_WINDOW_CHARS)
            : joined;
        });
        setKoPartial("");
        setTranslationError(null);
      }),
      listen<TranslationErrorPayload>("translation_error", (event) => {
        setTranslationError(event.payload.message);
        setKoPartial("");
      }),
    ];
    return () => {
      subs.forEach((p) => p.then((fn) => fn()));
    };
  }, []);

  // Priority: STT error > caption stream > DRM placeholder > default.
  // Once captions are flowing, drm_status is by definition false; suppress
  // the placeholder so it doesn't flicker between caption tokens.
  const hasEnCaption = finalText.length > 0 || partialText.length > 0;
  const hasKoCaption = koText.length > 0 || koPartial.length > 0;
  const hasAnyCaption = hasEnCaption || hasKoCaption;

  // caption_mode visibility: ko = KO only, ko_en = both, en = EN only
  const showKo = captionMode === "ko" || captionMode === "ko_en";
  const showEn = captionMode === "en" || captionMode === "ko_en";

  let body: React.ReactNode;
  if (sttError) {
    body = <span style={{ fontStyle: "italic" }}>STT: {sttError}</span>;
  } else if (hasAnyCaption) {
    body = (
      <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
        {/* English (source) — smaller / lighter so Korean wins focus.
            Hidden when caption_mode is "ko". */}
        {showEn && (
          <div
            style={{
              fontSize: 11,
              color: "rgba(40, 40, 40, 0.55)",
              lineHeight: 1.35,
              minHeight: "1.35em",
            }}
          >
            {finalText}
            {partialText && (
              <span style={{ opacity: 0.7 }}>
                {finalText ? " " : ""}
                {partialText}
              </span>
            )}
          </div>
        )}
        {/* Korean (translation) — primary value layer. Partial streams in
            token-by-token via translation_partial; commits to koText on
            translation_final and partial clears.
            Hidden when caption_mode is "en". */}
        {showKo && (
          <div
            style={{
              fontSize: captionFontSize,
              color: "rgba(15, 15, 15, 0.92)",
              lineHeight: 1.45,
              fontWeight: 400,
              minHeight: "1.45em",
            }}
          >
            {koText}
            {koPartial && (
              <span style={{ opacity: 0.65 }}>
                {koText ? " " : ""}
                {koPartial}
              </span>
            )}
            {translationError && !koText && !koPartial && (
              <span style={{ fontSize: 11, fontStyle: "italic", color: "rgba(40, 40, 40, 0.55)" }}>
                번역 대기 중… ({translationError})
              </span>
            )}
          </div>
        )}
      </div>
    );
  } else if (drmBlocked) {
    body = "No audio detected.";
  } else {
    body = "Awaiting English audio.";
  }

  const bgAlpha = overlayOpacity / 100;

  return (
    <div
      data-tauri-drag-region
      style={{
        width: "100%",
        height: "100vh",
        background: `rgba(248, 247, 244, ${bgAlpha})`,
        backdropFilter: "blur(12px)",
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: 13,
        fontStyle: hasAnyCaption ? "normal" : "italic",
        color: hasAnyCaption ? "rgba(20, 20, 20, 0.85)" : "rgba(40, 40, 40, 0.6)",
        WebkitUserSelect: "none",
        padding: "10px 14px",
        textAlign: "left",
        lineHeight: 1.45,
        overflow: "hidden",
      } as CSSProperties}
    >
      {body}
    </div>
  );
}

interface DriftStats {
  max_drift_ms: number;
  final_drift_ms: number;
  paired_samples: number;
}

interface RssStats {
  samples: number;
  peak_rss_mb: number;
  mean_rss_mb: number;
  log_path: string;
}

interface CaptureStats {
  buffers_received: number;
  frames_written: number;
  seconds_captured: number;
  mic_buffers_received: number;
  mic_frames_written: number;
  mic_seconds_captured: number;
  drift: DriftStats;
  system_segments_written: number;
  system_bytes_written: number;
  mic_segments_written: number;
  mic_bytes_written: number;
  rss: RssStats;
  peak_system_dbfs: number;
  drm_detected: boolean;
}

interface KeyStatus {
  present: boolean;
  source: "keychain" | "env" | null;
}

function App() {
  const [captureStatus, setCaptureStatus] = useState("");
  const [seconds, setSeconds] = useState(10);
  const [captureRunning, setCaptureRunning] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [keysMissing, setKeysMissing] = useState(false);

  const refreshKeyStatus = async () => {
    try {
      const [s, u] = await Promise.all([
        invoke<KeyStatus>("api_key_status", { name: "SONIOX_API_KEY" }),
        invoke<KeyStatus>("api_key_status", { name: "UPSTAGE_API_KEY" }),
      ]);
      setKeysMissing(!s.present || !u.present);
    } catch {
      // Backend down or command unavailable — leave banner hidden so we
      // don't pester the user about a transient issue.
    }
  };

  useEffect(() => {
    refreshKeyStatus();
  }, []);

  const formatStats = (stats: CaptureStats): string => {
    const drmTag = stats.drm_detected
      ? `silent (peak ${stats.peak_system_dbfs.toFixed(1)} dBFS — muted/paused/DRM?) | `
      : `level peak ${stats.peak_system_dbfs.toFixed(1)} dBFS | `;
    return (
      drmTag +
      `sys: ${stats.buffers_received}b / ${stats.system_segments_written}seg / ${(stats.system_bytes_written / 1024).toFixed(1)}KB | ` +
      `mic: ${stats.mic_buffers_received}b / ${stats.mic_segments_written}seg / ${(stats.mic_bytes_written / 1024).toFixed(1)}KB | ` +
      `drift: max ${stats.drift.max_drift_ms.toFixed(2)}ms | ` +
      `peak ${stats.rss.peak_rss_mb.toFixed(0)}MB / ${stats.rss.samples} rss samples`
    );
  };

  if (isOverlay) {
    return <Overlay />;
  }

  if (isGallery) {
    return (
      <Suspense fallback={null}>
        <Gallery />
      </Suspense>
    );
  }

  return (
    <main className="container">
      <button
        className="settings-gear"
        onClick={() => setSettingsOpen(true)}
        aria-label="Settings"
        title="Settings"
      >
        ⚙
      </button>

      <header className="capture-hero">
        <h1 className="display">bartleby</h1>
        <div className="serif-quote capture-epigraph">
          "I would prefer not to take notes."
        </div>
      </header>

      {keysMissing && !settingsOpen && (
        <button
          className="key-banner"
          onClick={() => setSettingsOpen(true)}
        >
          Add API keys to start →
        </button>
      )}

      <section className="capture-panel">
        <div className="capture-row">
          <input
            type="number"
            min="10"
            max="3600"
            step="1"
            value={seconds}
            onChange={(e) => setSeconds(Number(e.currentTarget.value))}
          />
          <button
            className="btn"
            disabled={captureRunning}
            onClick={async () => {
              setCaptureStatus("Capturing...");
              try {
                const stats = await invoke<CaptureStats>("capture_system_audio", { seconds });
                setCaptureStatus(formatStats(stats));
              } catch (err) {
                setCaptureStatus(`Error: ${String(err)}`);
              }
            }}
          >
            Capture {seconds}s
          </button>
        </div>

        <div className="capture-row">
          <button
            className="btn btn-primary"
            disabled={captureRunning}
            onClick={async () => {
              try {
                await invoke("start_capture");
                setCaptureRunning(true);
                setCaptureStatus("Listening...");
              } catch (err) {
                setCaptureStatus(`Error: ${String(err)}`);
              }
            }}
          >
            Start capture
          </button>
          <button
            className="btn"
            disabled={!captureRunning}
            onClick={async () => {
              try {
                const stats = await invoke<CaptureStats>("stop_capture");
                setCaptureRunning(false);
                setCaptureStatus(formatStats(stats));
              } catch (err) {
                setCaptureRunning(false);
                setCaptureStatus(`Error: ${String(err)}`);
              }
            }}
          >
            Stop capture
          </button>
        </div>

        {captureStatus && (
          <p className="capture-status mono">{captureStatus}</p>
        )}
      </section>

      {settingsOpen && (
        <Settings
          onClose={() => setSettingsOpen(false)}
          onChange={refreshKeyStatus}
        />
      )}
    </main>
  );
}

export default App;
