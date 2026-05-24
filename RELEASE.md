# Bartleby release runbook

Bartleby follows the Copy & Taste release shape, adapted from Sparkle/appcast to Tauri v2 updater/latest.json.

## Release channels

- Installer: `web/releases/Bartleby_<version>.dmg`
- Updater feed: `web/latest.json`
- Update bundle: Tauri-generated `Bartleby.app.tar.gz` plus `.sig`
- Web host: static Vercel project rooted at `web/`

## One-time setup

1. Keep the updater private key outside git:
   - Private key path on this machine: `~/.config/secrets/bartleby-updater.key`
   - Public key is committed in `src-tauri/tauri.conf.json` under `plugins.updater.pubkey`.
   - Back up the private key securely. Losing it prevents future signed updates for installed users.
2. Configure Apple Developer signing/notarization for Tauri builds.
3. Point `heybartleby.com` at the Vercel project that serves `web/`.
4. Confirm Vercel keeps `/latest.json` low-cache and `/releases/*` immutable; see `web/vercel.json`.

## Build a release

```sh
export TAURI_SIGNING_PRIVATE_KEY_PATH="$HOME/.config/secrets/bartleby-updater.key"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD=""

pnpm install
pnpm build
pnpm build:mac
```

For a single universal macOS updater asset, use:

```sh
pnpm build:mac:universal
```

Tauri v2 generates updater artifacts when `bundle.createUpdaterArtifacts` is true:

- macOS app bundle: `src-tauri/target/<target>/release/bundle/macos/Bartleby.app`
- updater archive: `Bartleby.app.tar.gz`
- updater signature: `Bartleby.app.tar.gz.sig`
- public installer: `src-tauri/target/<target>/release/bundle/dmg/*.dmg`

## Publish artifacts

1. Copy the notarized DMG into `web/releases/`.
2. Copy `Bartleby.app.tar.gz` into `web/releases/`.
3. Read the full text of `Bartleby.app.tar.gz.sig` and place it in `web/latest.json` under each macOS platform key you support.
4. Set `web/latest.json.version` to the new SemVer and `pub_date` to the release timestamp.
5. Ensure `url` fields point at the exact immutable release asset URLs.
6. Commit the release metadata and push. Vercel deploys the static web root automatically from git.
7. Tag the release after the deploy is live.

## Verify before announcing

```sh
pnpm build
git diff --check
```

Then verify manually on a clean macOS account or VM:

1. Download the DMG from `https://heybartleby.com/releases/...`.
2. Install Bartleby and launch it.
3. Confirm onboarding appears.
4. Grant Microphone, return to Bartleby, and recheck.
5. Grant Screen Recording, restart if macOS requires it, and recheck.
6. Paste Soniox and Upstage keys, verify, and save.
7. Start/stop a short recording and confirm a saved session appears.
8. Bump a test build above the installed version, update `latest.json`, and confirm Settings → About → Check can download/install/relaunch.

## Rollback

- If the DMG is bad but the updater feed has not been published, remove the DMG from `web/releases/` and ship a fixed build.
- If the updater feed is bad, update `latest.json` immediately with a newer fixed version. Tauri's updater only installs versions newer than the running app by default.
- Do not rotate the updater key unless absolutely necessary; existing installs trust the current public key.
