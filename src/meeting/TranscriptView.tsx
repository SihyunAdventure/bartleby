import { useEffect, useRef } from "react";
import type { SavedUtterance } from "./types";
import styles from "./TranscriptView.module.css";

interface Props {
  utterances: SavedUtterance[];
}

export default function TranscriptView({ utterances }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new utterances, but only when user is near the
  // bottom (within 40px). If the user has scrolled up to review history,
  // new utterances do not yank them back down.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
      el.scrollTop = el.scrollHeight;
    }
  }, [utterances]);

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
