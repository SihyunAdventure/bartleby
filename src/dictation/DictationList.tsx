import { useState } from "react";
import type { Dictation } from "./dictationsStore";
import { formatRelativeDay, formatTime } from "../meeting/types";
import styles from "./DictationList.module.css";

interface Props {
  dictations: Dictation[];
  onDelete: (id: number) => void;
}

export default function DictationList({ dictations, onDelete }: Props) {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = async (d: Dictation) => {
    try {
      await navigator.clipboard.writeText(d.text);
      setCopiedId(d.id);
      window.setTimeout(() => {
        setCopiedId((cur) => (cur === d.id ? null : cur));
      }, 1500);
    } catch (e) {
      console.warn("[dictations] copy failed:", e);
    }
  };

  const countLabel =
    dictations.length === 0
      ? "no dictations yet"
      : `${dictations.length} ${dictations.length === 1 ? "dictation" : "dictations"}`;

  return (
    <div className={styles.shell}>
      <div className={styles.toolbar}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>받아쓰기</h1>
          <div className={styles.eyebrow}>{countLabel}</div>
        </div>
      </div>

      <hr className="hr" />

      {dictations.length === 0 ? (
        <div className={styles.emptyWrap}>
          <div className="empty-state">
            <div className="quote">아직 받아쓴 내용이 없어요</div>
            <p className={styles.emptyHint}>
              받아쓰기 단축키를 누르고 말하면, 커서 위치에 입력된 내용이 여기
              기록으로 남습니다.
            </p>
          </div>
        </div>
      ) : (
        <div className={styles.list}>
          {dictations.map((d) => (
            <div key={d.id} className={styles.card}>
              <p className={styles.text}>{d.text}</p>
              <div className={styles.cardFooter}>
                <span className={`${styles.meta} tabular`}>
                  {formatRelativeDay(d.createdAt)} · {formatTime(d.createdAt)}
                </span>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.action}
                    onClick={() => handleCopy(d)}
                  >
                    {copiedId === d.id ? "복사됨" : "복사"}
                  </button>
                  <button
                    type="button"
                    className={styles.action}
                    onClick={() => onDelete(d.id)}
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
