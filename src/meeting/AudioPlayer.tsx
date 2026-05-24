import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core";

// Phase 6 S5 — In-app audio playback. Bartleby stores each capture as
// rolling 5-second Opus segments under {app_data}/audio/{session_id}/.
// We render two <audio> elements (sys / mic), each chained across its
// segment list: onended → bump currentIdx → reload src. Webview reaches
// the files via Tauri's asset:// protocol (tauri.conf.json's
// assetProtocol scope covers $APPDATA/audio/**).
//
// Transcript-row → audio jump is a follow-up slice; right now the
// player exposes Play/Pause for both tracks separately.

interface AudioSegments {
  sys: string[];
  mic: string[];
}

interface Props {
  audioDir: string;
}

interface TrackProps {
  label: string;
  segments: string[];
}

function Track({ label, segments }: TrackProps) {
  const [idx, setIdx] = useState(0);
  const ref = useRef<HTMLAudioElement>(null);

  // Reload src when idx changes — <audio> doesn't re-fetch automatically.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.load();
    // If playback was rolling we want it to continue into the next segment
    // without the user clicking Play again. A simple heuristic: any time
    // we advance the index past 0, autoplay the new src.
    if (idx > 0) {
      void el.play().catch(() => {});
    }
  }, [idx]);

  if (segments.length === 0) {
    return (
      <div style={{ display: "flex", gap: 12, alignItems: "center", opacity: 0.5 }}>
        <strong style={{ minWidth: 60 }}>{label}</strong>
        <span style={{ fontStyle: "italic" }}>no audio</span>
      </div>
    );
  }

  const onEnded = () => {
    if (idx + 1 < segments.length) {
      setIdx(idx + 1);
    } else {
      setIdx(0);
    }
  };

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <strong style={{ minWidth: 60 }}>{label}</strong>
      <audio
        ref={ref}
        src={convertFileSrc(segments[idx])}
        controls
        preload="metadata"
        onEnded={onEnded}
        style={{ flex: 1, height: 32 }}
      />
      <span style={{ fontSize: 11, opacity: 0.6, minWidth: 70, textAlign: "right" }}>
        {idx + 1} / {segments.length}
      </span>
    </div>
  );
}

export default function AudioPlayer({ audioDir }: Props) {
  const [segs, setSegs] = useState<AudioSegments | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!audioDir) {
      setSegs({ sys: [], mic: [] });
      return;
    }
    invoke<AudioSegments>("list_audio_segments", { dir: audioDir })
      .then(setSegs)
      .catch((e) => setError(String(e)));
  }, [audioDir]);

  if (!audioDir) {
    return (
      <div style={{ padding: "12px 0", opacity: 0.5, fontSize: 13 }}>
        Audio not saved for this session.
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ padding: "12px 0", color: "var(--ink-warm)", fontSize: 13 }}>
        Failed to load audio: {error}
      </div>
    );
  }
  if (!segs) {
    return (
      <div style={{ padding: "12px 0", opacity: 0.5, fontSize: 13 }}>
        Loading audio…
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 0" }}>
      <Track label="System" segments={segs.sys} />
      <Track label="Mic" segments={segs.mic} />
    </div>
  );
}
