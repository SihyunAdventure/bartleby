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
