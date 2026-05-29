import ReactMarkdown from "react-markdown";
import type { UpdateProgress } from "./updater";
import styles from "./UpdateModal.module.css";

export type UpdatePhase = "prompt" | "downloading" | "error";

interface Props {
  version: string;
  notes?: string | null;
  mandatory: boolean;
  phase: UpdatePhase;
  progress: UpdateProgress | null;
  errorMsg?: string | null;
  onInstall: () => void;
  onLater: () => void;
  onRetry: () => void;
}

const DOWNLOAD_PAGE = "https://heybartleby.com";

function percent(p: UpdateProgress | null): number | null {
  if (!p || !p.contentLength) return null;
  return Math.min(100, Math.round((p.downloadedBytes / p.contentLength) * 100));
}

export default function UpdateModal({
  version,
  notes,
  mandatory,
  phase,
  progress,
  errorMsg,
  onInstall,
  onLater,
  onRetry,
}: Props) {
  const dismissable = !mandatory && phase === "prompt";
  const pct = percent(progress);

  return (
    <div
      className={styles.backdrop}
      onClick={() => dismissable && onLater()}
    >
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <p className={styles.kicker}>
            {mandatory ? "Required update" : "Update available"}
          </p>
          <h2 className={styles.title}>Bartleby {version}</h2>
        </div>

        {notes && (
          <div className={styles.notes}>
            <ReactMarkdown>{notes}</ReactMarkdown>
          </div>
        )}

        {mandatory && phase !== "error" && (
          <p className={styles.mandatoryNote}>
            이 버전은 필수 업데이트입니다. 계속하려면 설치해 주세요.
          </p>
        )}

        {phase === "downloading" && (
          <div className={styles.progressWrap}>
            <div className={styles.progressTrack}>
              <div
                className={pct === null ? styles.progressIndeterminate : styles.progressFill}
                style={pct === null ? undefined : { width: `${pct}%` }}
              />
            </div>
            <span className={styles.progressLabel}>
              {pct === null ? "다운로드 중…" : `다운로드 중… ${pct}%`}
            </span>
          </div>
        )}

        {phase === "error" && (
          <div className={styles.error}>
            <p className={styles.errorMsg}>
              자동 업데이트에 실패했습니다{errorMsg ? `: ${errorMsg}` : "."}
            </p>
            <p className={styles.errorHint}>
              잠시 후 다시 시도하거나, 아래에서 직접 받아 설치할 수 있습니다.
            </p>
          </div>
        )}

        <div className={styles.actions}>
          {phase === "error" ? (
            <>
              <button className="btn btn-primary" onClick={onRetry}>
                다시 시도
              </button>
              <a className="btn btn-secondary" href={DOWNLOAD_PAGE} target="_blank" rel="noreferrer">
                수동 다운로드
              </a>
              {!mandatory && (
                <button className="btn btn-ghost" onClick={onLater}>
                  나중에
                </button>
              )}
            </>
          ) : (
            <>
              <button
                className="btn btn-primary"
                onClick={onInstall}
                disabled={phase === "downloading"}
              >
                {phase === "downloading" ? "설치 준비 중…" : "설치하고 재시작"}
              </button>
              {dismissable && (
                <button className="btn btn-ghost" onClick={onLater}>
                  나중에
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
