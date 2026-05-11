import type { MeetingSession } from "./types";
import {
  formatDuration,
  formatRelativeDay,
  formatTime,
} from "./types";
import styles from "./Library.module.css";

interface Props {
  sessions: MeetingSession[];
  onStartRecord: () => void;
  onSelectSession: (id: number) => void;
}

export default function Library({ sessions, onStartRecord, onSelectSession }: Props) {
  const totalSec = sessions.reduce((s, x) => s + x.durationSec, 0);
  const totalHm =
    totalSec >= 3600
      ? `${Math.floor(totalSec / 3600)}h ${Math.floor((totalSec % 3600) / 60)}m`
      : `${Math.floor(totalSec / 60)}m ${Math.floor(totalSec % 60)}s`;
  const countLabel =
    sessions.length === 0
      ? "no meetings yet"
      : `${sessions.length} ${sessions.length === 1 ? "meeting" : "meetings"} · ${totalHm}`;

  return (
    <div className={styles.shell}>
      <div className={styles.toolbar}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>All meetings</h1>
          <div className={styles.eyebrow}>{countLabel}</div>
        </div>
        <button
          className="btn btn-primary"
          onClick={onStartRecord}
        >
          <span className="dot dot-rec" />
          Record
        </button>
      </div>

      <hr className="hr" />

      {sessions.length === 0 ? (
        <div className={styles.emptyWrap}>
          <div className="empty-state">
            <div className="quote">
              "I would prefer not to&hellip; yet."
            </div>
            <p className={styles.emptyHint}>
              Press <strong>Record</strong> to begin a session. Bartleby will
              transcribe, translate, and quietly summarise as you talk.
            </p>
          </div>
        </div>
      ) : (
        <div className="mlist">
          {sessions
            .slice()
            .reverse()
            .map((s) => {
              const day = formatRelativeDay(s.startedAt);
              const time = formatTime(s.startedAt);
              const dur = formatDuration(s.durationSec);
              return (
                <button key={s.id} className="mrow" type="button" onClick={() => onSelectSession(s.id)}>
                  <div className="when tabular">
                    {time}
                    <small>
                      {day} · {dur}
                    </small>
                  </div>
                  <div>
                    <div className="title">{s.title}</div>
                    <div className="preview">{s.preview}</div>
                    <div
                      className="row gap-2"
                      style={{ marginTop: 8 }}
                    >
                      <span className="badge">EN/KO</span>
                      {s.stats.drm_detected && (
                        <span className="badge badge-warn">
                          DRM silence
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="meta">
                    {s.stats.system_segments_written} seg
                    <br />
                    {(s.stats.system_bytes_written / 1024).toFixed(0)} KB
                  </div>
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}
