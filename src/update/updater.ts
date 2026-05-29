import { check, type DownloadEvent, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export type UpdateProgress = {
  downloadedBytes: number;
  contentLength: number | null;
  finished: boolean;
};

export function updatesDisabledInDev(): boolean {
  return import.meta.env.DEV;
}

// Compare two "x.y.z" strings. Returns -1 if a < b, 0 if equal, 1 if a > b.
// Tolerant of missing/short segments and a leading "v".
function compareSemver(a: string, b: string): number {
  const norm = (s: string) => s.replace(/^v/, "").split(".").map((n) => parseInt(n, 10) || 0);
  const pa = norm(a);
  const pb = norm(b);
  for (let i = 0; i < 3; i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

// A release can carry a custom `min_version` in latest.json (read via the
// updater's rawJson escape hatch — the plugin ignores unknown feed fields).
// When the running app is OLDER than min_version, the update is mandatory and
// the UI must block until it installs. Absent/garbage field => not mandatory.
export function isUpdateMandatory(update: Update): boolean {
  const raw = (update as { rawJson?: Record<string, unknown> }).rawJson;
  const min = raw?.min_version;
  if (typeof min !== "string" || !min) return false;
  try {
    return compareSemver(update.currentVersion, min) < 0;
  } catch {
    return false;
  }
}

export async function checkForAppUpdate(options?: {
  force?: boolean;
}): Promise<Update | null> {
  if (updatesDisabledInDev() && !options?.force) {
    return null;
  }
  return check({ timeout: 10_000 });
}

export async function installUpdateAndRelaunch(
  update: Update,
  onProgress?: (progress: UpdateProgress) => void,
): Promise<void> {
  let downloadedBytes = 0;
  let contentLength: number | null = null;

  const handleProgress = (event: DownloadEvent) => {
    if (event.event === "Started") {
      downloadedBytes = 0;
      contentLength = event.data.contentLength ?? null;
    } else if (event.event === "Progress") {
      downloadedBytes += event.data.chunkLength;
    } else if (event.event === "Finished") {
      onProgress?.({ downloadedBytes, contentLength, finished: true });
      return;
    }

    onProgress?.({ downloadedBytes, contentLength, finished: false });
  };

  await update.downloadAndInstall(handleProgress, { timeout: 120_000 });
  await relaunch();
}
