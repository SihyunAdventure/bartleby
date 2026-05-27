# Bartleby release flow

Use this whenever a public change should become a downloadable Mac update.
Commit the feature/fix first, then run this from a clean tree. The script creates a separate release commit.
It keeps the app version, changelog, updater feed, GitHub Release, and Vercel site in sync.

## One-command patch release

```bash
pnpm release:ship -- --patch \
  --title "Short changelog title" \
  --notes "One paragraph users can understand. Mention the visible change and any risk fixed."
```

What it does:

1. Requires a clean git tree.
2. Bumps `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, and `Cargo.lock`.
3. Updates download links in `web/` and inserts a new `web/changelog.html` entry.
4. Runs `pnpm build` and `cargo test --manifest-path src-tauri/Cargo.toml`.
5. Builds a universal signed Tauri Mac app and updater archive.
6. Verifies codesign, submits the DMG to Apple notarization, staples, validates, and runs `spctl`.
7. Copies DMG/updater artifacts into `web/releases/` and writes `web/latest.json`.
8. Commits the release, tags `vX.Y.Z`, pushes `main --tags`.
9. Creates the GitHub Release with DMG, updater archive, and updater signature.
10. Runs `vercel deploy --prod` and verifies live `latest.json` plus release artifact URLs.

## Explicit version

```bash
pnpm release:ship -- --version 0.2.0 \
  --title "Public beta refresh" \
  --notes "..."
```

## Dry run

```bash
pnpm release:dry-run -- --patch --title "Check" --notes "No files are changed."
```

## Local-only repair mode

If GitHub/Vercel are temporarily unavailable, create artifacts without pushing:

```bash
pnpm release:ship -- --patch --title "..." --notes "..." --skip-push
```

Then inspect the commit locally and rerun the failed external step manually.

## Website-only auto deploy

`.github/workflows/web-deploy.yml` deploys the `web/` root on pushes to `main` when the GitHub secret `VERCEL_TOKEN` is configured. If the secret is missing, the workflow skips cleanly so local releases and Vercel Git integration can still own deployment.

## Required local credentials

- Apple Developer ID signing identity: `Developer ID Application: Notique Inc. (7M2DZPHB8R)`
- Notarytool keychain profile: `notique-notary`
- Tauri updater private key: `~/.config/secrets/bartleby-updater.key`
- GitHub CLI authenticated for `SihyunAdventure/bartleby`
- Vercel CLI linked to the `bartleby` project under `sihyuns-projects-c7bedc87`

Do not hand-edit `web/latest.json` signatures during normal releases. The script copies the raw Tauri `.sig` content into the updater feed.
