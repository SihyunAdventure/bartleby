import { useEffect, useRef } from "react";
import type { SavedUtterance } from "./types";
import type { PartialEntry } from "./Meeting";
import styles from "./TranscriptView.module.css";

interface Props {
  utterances: SavedUtterance[];
  partial?: PartialEntry | null;
}

function endsWithSentence(text: string): boolean {
  return /[.?!]["')\]]?\s*$/.test(text);
}

export default function TranscriptView({ utterances, partial }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Smooth scroll to bottom on new content, but only when the user is already
  // near the bottom. If they scrolled up to review history, new tokens don't
  // yank them back. Smooth behavior avoids the abrupt jump-on-every-token
  // jitter that the cumulative partial updates would otherwise produce.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [utterances, partial]);

  const lastIdx = utterances.length - 1;
  const last = lastIdx >= 0 ? utterances[lastIdx] : null;
  const partialText =
    partial && partial.text.length > 0 ? partial.text : null;

  // Inline the partial into the last row when (1) same speaker and (2) that
  // row hasn't closed a sentence yet. Otherwise the partial gets its own
  // ghost row at the tail. Either way, the row that owns an unfinished
  // sentence stays in the dim italic style — black only appears once
  // punctuation actually lands.
  const inlinePartialOnLast =
    !!last &&
    !!partialText &&
    !!partial &&
    last.speaker === partial.speaker &&
    !endsWithSentence(last.enText);

  const showSeparateGhost = !!partialText && !inlinePartialOnLast;

  return (
    <div className={styles.container}>
      <div className={styles.header}>Transcript</div>
      <div className={styles.scroll} ref={scrollRef}>
        {utterances.length === 0 && !partialText ? (
          <p className={styles.empty}>
            Bartleby is listening, would prefer not to speak.
          </p>
        ) : (
          <>
            {utterances.map((u, i) => {
              const isLast = i === lastIdx;
              const rowOpen = !endsWithSentence(u.enText);
              // The row stays "open" (dim italic) until a sentence boundary
              // arrives. Closed rows render as solid black.
              const dim = rowOpen;
              const inlineTail =
                isLast && inlinePartialOnLast && partialText
                  ? partialText
                  : null;
              return (
                <div
                  key={u.id}
                  className={`${styles.utterance} ${dim ? styles.pending : ""}`}
                >
                  <span className={styles.time}>{u.time}</span>
                  <span
                    className={styles.speakerPill}
                    data-speaker={u.speaker}
                  >
                    {u.speaker}
                  </span>
                  <div className={styles.textBlock}>
                    <p className={styles.enText}>
                      {u.enText}
                      {inlineTail && (
                        <span className={styles.partialTail}>
                          {" "}
                          {inlineTail}
                        </span>
                      )}
                    </p>
                    {u.koText && <p className={styles.koText}>{u.koText}</p>}
                  </div>
                </div>
              );
            })}
            {showSeparateGhost && partial && (
              <div className={`${styles.utterance} ${styles.partial}`}>
                <span className={styles.time}>···</span>
                <span
                  className={styles.speakerPill}
                  data-speaker={partial.speaker}
                >
                  {partial.speaker}
                </span>
                <div className={styles.textBlock}>
                  <p className={styles.enText}>{partial.text}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
