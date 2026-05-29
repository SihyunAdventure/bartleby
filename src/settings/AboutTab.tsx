import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";
import type { Update } from "@tauri-apps/plugin-updater";
import {
  checkForAppUpdate,
  installUpdateAndRelaunch,
  updatesDisabledInDev,
  type UpdateProgress,
} from "../update/updater";
import styles from "./AboutTab.module.css";

export default function AboutTab() {
  const [version, setVersion] = useState("");
  useEffect(() => {
    getVersion().then(setVersion).catch(() => {});
  }, []);

  // In-app feedback (stored in Neon via the /api/review backend).
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);

  const sendFeedback = async () => {
    if (!feedback.trim() && rating === 0) return;
    setSending(true);
    setFeedbackStatus(null);
    try {
      await invoke("submit_review", { rating: rating || null, body: feedback.trim() });
      setFeedbackStatus("보내주셔서 감사합니다.");
      setRating(0);
      setFeedback("");
    } catch (err) {
      setFeedbackStatus(`전송 실패: ${String(err)}`);
    } finally {
      setSending(false);
    }
  };

  const [update, setUpdate] = useState<Update | null>(null);
  const [checking, setChecking] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [message, setMessage] = useState<string>(
    updatesDisabledInDev()
      ? "Dev mode skips automatic update checks."
      : "Bartleby checks for updates on launch.",
  );
  const [progress, setProgress] = useState<UpdateProgress | null>(null);

  const handleCheck = async () => {
    setChecking(true);
    setMessage("Checking heybartleby.com/latest.json…");
    setProgress(null);
    try {
      const next = await checkForAppUpdate({ force: true });
      setUpdate(next);
      setMessage(
        next
          ? `Update ${next.version} is available.`
          : "You are on the latest available version.",
      );
    } catch (err) {
      setMessage(`Update check failed: ${String(err)}`);
    } finally {
      setChecking(false);
    }
  };

  const handleInstall = async () => {
    if (!update) return;
    setInstalling(true);
    setMessage(`Installing Bartleby ${update.version}…`);
    try {
      await installUpdateAndRelaunch(update, setProgress);
    } catch (err) {
      setMessage(`Update install failed: ${String(err)}`);
      setInstalling(false);
    }
  };

  const progressLabel = progress
    ? progress.contentLength
      ? `${Math.round((progress.downloadedBytes / progress.contentLength) * 100)}%`
      : `${Math.round(progress.downloadedBytes / 1024 / 1024)} MB`
    : null;

  return (
    <div className={styles.root}>
      <div className={styles.hero}>
        <span className={styles.name}>Bartleby</span>
        <span className={styles.version}>v{version}</span>
        <p className={styles.tagline}>"I would prefer not to listen in English."</p>
      </div>

      <div className={styles.links}>
        <a
          href="https://heybartleby.com"
          target="_blank"
          rel="noreferrer"
          className={styles.link}
        >
          heybartleby.com
        </a>
        <span className={styles.sep}>·</span>
        <a
          href="https://github.com/heybartleby/bartleby"
          target="_blank"
          rel="noreferrer"
          className={styles.link}
        >
          github.com/heybartleby/bartleby
        </a>
      </div>

      <div className={styles.divider} />

      <div className={styles.row}>
        <span className={styles.fieldLabel}>Show / hide Bartleby</span>
        <span className={styles.shortcut}>⌘ ⇧ B</span>
      </div>

      <section className={styles.updateCard}>
        <div>
          <span className={styles.fieldLabel}>Updates</span>
          <p className={styles.updateMessage}>
            {message}
            {progressLabel ? ` (${progressLabel})` : ""}
          </p>
        </div>
        <div className={styles.updateActions}>
          <button className="btn" onClick={handleCheck} disabled={checking || installing}>
            {checking ? "Checking…" : "Check"}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleInstall}
            disabled={!update || checking || installing}
          >
            {installing ? "Installing…" : "Install"}
          </button>
        </div>
      </section>

      <section className={styles.feedbackCard}>
        <span className={styles.fieldLabel}>피드백 보내기</span>
        <div className={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`${styles.star} ${n <= rating ? styles.starOn : ""}`}
              aria-label={`${n}점`}
              onClick={() => setRating(n === rating ? 0 : n)}
            >
              ★
            </button>
          ))}
        </div>
        <textarea
          className={styles.textarea}
          placeholder="좋았던 점, 불편한 점, 바라는 기능을 자유롭게 적어주세요. 회의 내용은 전송되지 않습니다."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          maxLength={5000}
        />
        <div className={styles.feedbackActions}>
          <span className={styles.feedbackStatus}>{feedbackStatus ?? ""}</span>
          <button
            className="btn btn-primary"
            onClick={sendFeedback}
            disabled={sending || (!feedback.trim() && rating === 0)}
          >
            {sending ? "보내는 중…" : "보내기"}
          </button>
        </div>
      </section>

      <p className={styles.footer}>Design with care from Seoul.</p>
    </div>
  );
}
