import { useState } from "react";
import type { Update } from "@tauri-apps/plugin-updater";
import {
  checkForAppUpdate,
  installUpdateAndRelaunch,
  updatesDisabledInDev,
  type UpdateProgress,
} from "../update/updater";
import styles from "./AboutTab.module.css";

const VERSION = "0.1.1";

export default function AboutTab() {
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
        <span className={styles.version}>v{VERSION}</span>
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

      <p className={styles.footer}>Design with care from Seoul.</p>
    </div>
  );
}
