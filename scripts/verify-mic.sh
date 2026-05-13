#!/usr/bin/env bash
# Automated mic capture verify — no manual speech required.
#
# Path:
#   1. Quit any running Bartleby (avoid mic device contention).
#   2. Background: macOS `say` generates speaker output for ~7s.
#   3. Run standalone bartleby-mic (signed sidecar) capturing stdout to
#      /tmp/bartleby-mic.raw. Acoustic feedback from the laptop speaker
#      reaches the built-in mic and surfaces as real samples.
#   4. Compute peak / mean / activity ratio from the raw f32 stream and
#      print a PASS / MARGINAL / FAIL verdict.
#
# Limitation: this only verifies the sidecar in *standalone* context.
# It does NOT exercise the Bartleby + SCStream combined path — that
# still needs a manual Recording Start click in the UI (until a
# dev-mode autostart hook is added). Use this script as a regression
# guard for the sidecar binary and a fast signal during code iteration.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP="$REPO_ROOT/src-tauri/target/debug/bundle/macos/Bartleby.app"
SIDECAR="$APP/Contents/MacOS/bartleby-mic"
RAW=/tmp/bartleby-mic.raw
ERR=/tmp/bartleby-mic.err

if [ ! -x "$SIDECAR" ]; then
    echo "ERROR: $SIDECAR not found — run scripts/dev-run.sh first" >&2
    exit 1
fi

echo "→ killing any running Bartleby (avoid mic contention)"
pkill -f "/Bartleby.app/Contents/MacOS/bartleby" 2>/dev/null || true
sleep 1

echo "→ starting say in background — acoustic mic input"
(
    say --rate 180 "Bartleby microphone verify one two three"
    sleep 0.3
    say --rate 180 "Sample four five six seven"
    sleep 0.3
    say --rate 180 "Final test eight nine ten"
) >/dev/null 2>&1 &
SAY_PID=$!

echo "→ standalone bartleby-mic recording for 7s"
"$SIDECAR" > "$RAW" 2> "$ERR" &
SIDECAR_PID=$!
sleep 7
kill $SIDECAR_PID 2>/dev/null || true
wait $SIDECAR_PID 2>/dev/null || true

kill $SAY_PID 2>/dev/null || true
wait $SAY_PID 2>/dev/null || true

echo ""
echo "=== sidecar stderr ==="
cat "$ERR"
echo ""
echo "=== peak / duration / activity ==="
python3 - <<PY
import struct, os, sys
sz = os.path.getsize("$RAW")
n = sz // 4
print(f"bytes={sz}  samples={n}  duration~={n/48000:.2f}s")
if n == 0:
    print("NO DATA — sidecar wrote nothing"); sys.exit(2)
with open("$RAW", "rb") as f:
    d = f.read(n * 4)
s = struct.unpack(f"<{n}f", d)
peak = max(map(abs, s))
mean = sum(map(abs, s)) / n
nz = sum(1 for x in s if abs(x) > 0.01)
print(f"peak={peak:.4f}  mean_abs={mean:.4f}  samples>0.01={nz} ({100*nz/n:.1f}%)")
if peak >= 0.1:
    print("VERDICT: PASS — sidecar receives real mic samples")
    sys.exit(0)
elif peak >= 0.02:
    print("VERDICT: MARGINAL — non-zero but below typical speech level")
    print("  hint: raise speaker volume or input gain, or quiet ambient noise")
    sys.exit(1)
else:
    print("VERDICT: FAIL — sidecar mic capture silent")
    sys.exit(2)
PY
