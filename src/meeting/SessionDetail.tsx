import type { MeetingSession } from "./types";
import { formatDuration, formatRelativeDay, formatTime } from "./types";
import styles from "./SessionDetail.module.css";

interface Props {
  session: MeetingSession;
  onBack: () => void;
}

export default function SessionDetail({ session, onBack }: Props) {
  const day = formatRelativeDay(session.startedAt);
  const start = formatTime(session.startedAt);
  const dur = formatDuration(session.durationSec);

  return (
    <div className={styles.shell}>
      <div className={styles.toolbar}>
        <button className="btn btn-ghost" onClick={onBack}>
          &larr; Back
        </button>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>{session.title}</h1>
          <div className={styles.eyebrow}>
            {day} &middot; {start} &middot; {dur} &middot;{" "}
            {session.transcript.length} utterances
          </div>
        </div>
      </div>
      <hr className="hr" />
      <div className={styles.body}>
        {session.transcript.length === 0 ? (
          <p className={styles.empty}>
            Bartleby was listening, would prefer not to speak. (No final
            transcripts captured.)
          </p>
        ) : (
          session.transcript.map((u) => (
            <div key={u.id} className="tbl-utt">
              <div className="ts tabular">{u.time}</div>
              <div>
                <div className="speaker">{u.speaker}</div>
                <div className={`speech${u.speaker === "user" ? " kr" : ""}`}>
                  {u.enText}
                </div>
                {u.koText && <div className="trans">{u.koText}</div>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
