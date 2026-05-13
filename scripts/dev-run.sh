#!/usr/bin/env bash
# Dev cycle helper: build → sign with stable Developer ID cert → launch.
#
# Why this script:
#   ad-hoc codesign rotates the binary's cdhash every build, so macOS TCC
#   treats each build as a brand-new client and silently denies microphone
#   / screen-recording without ever surfacing a prompt. Signing with a
#   stable Apple Developer ID gives the binary a designated requirement
#   that survives rebuilds, so the user grants once and it sticks.
#
# Notarization is intentionally NOT run here — that's a distribution step
# (Phase 6+). Hardened runtime + Developer ID alone is enough for local
# dev to clear TCC.

set -euo pipefail

# shellcheck source=/dev/null
[ -f "$HOME/.cargo/env" ] && source "$HOME/.cargo/env"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP="$REPO_ROOT/src-tauri/target/debug/bundle/macos/Bartleby.app"
ENTITLEMENTS="$REPO_ROOT/src-tauri/entitlements.plist"
SIGN_IDENTITY="Developer ID Application: Notique Inc. (7M2DZPHB8R)"

echo "→ killing any running Bartleby"
pkill -f "/Bartleby.app/Contents/MacOS/bartleby" 2>/dev/null || true
sleep 1

echo "→ truncating dev log"
mkdir -p "$HOME/Library/Logs/Bartleby"
: > "$HOME/Library/Logs/Bartleby/debug.log"

echo "→ pnpm tauri build --debug"
( cd "$REPO_ROOT" && pnpm tauri build --debug ) 2>&1 | tail -8

echo "→ swiftc bartleby-mic sidecar"
swiftc -O \
  "$REPO_ROOT/src-tauri/swift/bartleby-mic.swift" \
  -o "$APP/Contents/MacOS/bartleby-mic"

echo "→ codesign (stable Developer ID, hardened runtime)"
codesign --force --deep \
  --sign "$SIGN_IDENTITY" \
  --options runtime \
  --entitlements "$ENTITLEMENTS" \
  "$APP"

echo "→ verify codesign"
codesign --verify --deep --strict --verbose=2 "$APP" 2>&1 | tail -3

echo "→ sourcing dev API keys (ENV inject for Tauri secrets fallback)"
# shellcheck source=/dev/null
[ -f "$HOME/.config/secrets/soniox.env" ] && source "$HOME/.config/secrets/soniox.env"
# shellcheck source=/dev/null
[ -f "$HOME/.config/secrets/upstage.env" ] && source "$HOME/.config/secrets/upstage.env"

echo "→ launching Bartleby (PID will print)"
"$APP/Contents/MacOS/bartleby" &
echo "PID: $!"
