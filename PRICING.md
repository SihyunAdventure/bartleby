# Bartleby pricing

Decided 2026-05-29. Bartleby turns English meetings into Korean notes on macOS.
This is the pricing model; the enforcement/metering (paywall) layer is not built yet.

## Model

| Mode | Your marginal cost | Price |
|---|---|---|
| **BYOK** (user's own Soniox/Upstage keys) | $0 — user pays providers directly | **Free** |
| **Hosted** (Notique relay holds the keys) | API cost per use (see below) | **₩9,900 / month** |

- **Free tier (Hosted):** 5 hours of recording per month, then upgrade. ~<$1/free user/month — sustainable for acquisition.
- **Annual:** ~2 months free (≈ ₩99,000 / year) to lift retention/LTV.
- **Early adopters:** lock in the launch price forever (price-rise exempt). This is the real "grandfather" for a per-use-cost app — a price lock, not free-forever. Enabled by the `early_access` identity backend (machine registration).
- Start at ₩9,900 to gather conversions; raise the price for *new* users later as value proves out (₩12,900–15,900 headroom). Early users stay locked.

## Cost basis (why margin is huge)

Per meeting-hour (measured rates):
- Soniox `stt-rt-v4` realtime STT: ~$0.12/hr (×2 ≈ $0.24 if mic + system audio are separate streams).
- Upstage `solar-pro3` (translation + final note): ~$0.02/hr — negligible. ($0.15/1M input, $0.60/1M output tokens; ~12k tokens per hour of transcript.)
- **Total ≈ $0.15–0.25 per meeting-hour.** STT dominates.

Per user/month: light (5h) ≈ $1, heavy (40h) ≈ $6–10. Any reasonable subscription clears this easily.

## Positioning

Desktop-only is **not** a discount factor for meeting-notes tools — meeting audio must be captured on-device, so desktop *is* the product. [Granola](https://www.granola.ai/pricing) is Mac/Windows desktop-only (no web/mobile) and charges $14/user/month. Bartleby's wedge is **Korean** (English meeting → Korean notes), a niche Granola/Otter don't serve well, so price with confidence. ₩9,900 sits comfortably under Granola while leaving room to move up.

## Not built yet (next)

- **Licensing / metering layer**: enforce the 5h/month free cap, gate Hosted behind subscription, track entitlements per machine. The `early_access` table (machine identity) + `recording_usage` (per-machine minutes) are the foundation; the paywall logic and a payment integration are the remaining work.

## References

- Soniox pricing — https://soniox.com/pricing
- Upstage Solar Pro 3 — https://openrouter.ai/upstage/solar-pro-3
- Granola pricing — https://www.granola.ai/pricing
