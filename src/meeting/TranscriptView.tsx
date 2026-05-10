import { useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import styles from "./TranscriptView.module.css";

interface SttFinalPayload {
  text: string;
  language: string | null;
}

interface TranslationFinalPayload {
  original: string;
  translation: string;
}

interface Utterance {
  id: number;
  time: string;
  speaker: "user" | "system";
  enText: string;
  koText: string | null;
}

const MAX_UTTERANCES = 100;

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

interface Props {
  // clearToken increments when parent wants transcript cleared (on Start)
  clearToken: number;
}

export default function TranscriptView({ clearToken }: Props) {
  const [utterances, setUtterances] = useState<Utterance[]>([]);
  const idRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Clear transcript when clearToken changes
  useEffect(() => {
    if (clearToken > 0) {
      setUtterances([]);
    }
  }, [clearToken]);

  // Auto-scroll to bottom on new utterances
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [utterances]);

  useEffect(() => {
    // Map from stt_final original text → utterance id, so translation_final
    // can attach to the right utterance.
    const pendingTranslation = new Map<string, number>();

    const subs = [
      listen<SttFinalPayload>("stt_final", (event) => {
        const { text, language } = event.payload;
        // language "ko" → user (mic), anything else → system
        const speaker: "user" | "system" = language === "ko" ? "user" : "system";
        const id = ++idRef.current;
        const now = formatTime(new Date());

        pendingTranslation.set(text, id);

        setUtterances((prev) => {
          const next = [
            ...prev,
            { id, time: now, speaker, enText: text, koText: null },
          ];
          return next.length > MAX_UTTERANCES ? next.slice(-MAX_UTTERANCES) : next;
        });
      }),

      listen<TranslationFinalPayload>("translation_final", (event) => {
        const { original, translation } = event.payload;
        const targetId = pendingTranslation.get(original);
        if (targetId === undefined) return;
        pendingTranslation.delete(original);

        setUtterances((prev) =>
          prev.map((u) =>
            u.id === targetId ? { ...u, koText: translation } : u
          )
        );
      }),
    ];

    return () => {
      subs.forEach((p) => p.then((fn) => fn()));
    };
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>Transcript</div>
      <div className={styles.scroll} ref={scrollRef}>
        {utterances.length === 0 ? (
          <p className={styles.empty}>
            Bartleby is listening, would prefer not to speak.
          </p>
        ) : (
          utterances.map((u) => (
            <div key={u.id} className={styles.utterance}>
              <span className={styles.time}>{u.time}</span>
              <span
                className={styles.speakerPill}
                data-speaker={u.speaker}
              >
                {u.speaker}
              </span>
              <div className={styles.textBlock}>
                <p className={styles.enText}>{u.enText}</p>
                {u.koText && (
                  <p className={styles.koText}>{u.koText}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
