# Bartleby hosted API beta plan

Status: planned, not active in v0.1.1.
Decision date: 2026-05-26.

## Decision

For the first friends beta, Bartleby should support a **Notique-hosted API mode** in addition to BYOK.

Default friend flow:

```text
Bartleby app → Notique EC2 relay → Soniox stt-rt-v4 / Upstage solar-pro3
```

BYOK stays available as the advanced/privacy-first path:

```text
Bartleby app → Soniox / Upstage directly with user's own keys
```

We are not changing providers for this step. Keep Soniox `stt-rt-v4` and Upstage `solar-pro3` because the current app already works on that pair, cost is predictable, and changing models would add release risk right before friend testing.

## Why hosted mode now

BYOK is good for power users, but bad for friends beta onboarding. Asking a friend to create two provider accounts before their first recording adds friction at the exact wrong moment.

Hosted mode lets a friend install the DMG, grant permissions, sign in or paste an invite token, and record. The user sees Bartleby, not Soniox billing setup.

## Non-goals

- No bundled or auto-installed local model weights.
- No Gemini / Claude / GPT / OpenRouter fallback in this beta.
- No server-side permanent meeting library.
- No payment system for the first friends beta.
- No public unlimited plan until usage metering and abuse controls are live.

## Current AWS target

AWS CLI is configured for `ap-northeast-2` and can reach two running EC2 hosts through SSM.

Recommended target: **the existing shared `notique-agent` EC2 host**. Do not create a separate Bartleby instance for the friends beta, and do not rename the EC2 instance away from `notique-agent`. Bartleby should be recognizable through service/DNS names, not by taking over the shared host name.

| Field | Value |
|---|---|
| Shared host | `notique-agent` / `i-0eb065979dbad85b3` |
| Region | `ap-northeast-2` Seoul |
| Public IP | `3.37.71.254` Elastic IP |
| Instance type | `t3.micro` |
| OS | Amazon Linux 2023 |
| Access | SSM online, SSH open only from current home IP |
| Current listeners | SSH only |
| Disk | 24 GB gp3, about 7.8 GB free at inspection time |
| Memory | 916 MiB RAM + 2 GiB swap |

Why this host: it is the intended shared Notique agent box, SSM-managed, has a stable Elastic IP, and is currently lighter than the `MMC` host. Bartleby should run as a clearly named service on this shared host, alongside other Notique workloads, rather than as a dedicated EC2 instance.

## Cost estimate

As of 2026-05-26, AWS Seoul On-Demand pricing from the AWS Pricing API shows:

| Item | Estimate |
|---|---:|
| `t3.micro` Linux compute | `$0.013/hour`, about `$9.49/month` at 730 hours |
| Existing public IPv4 / Elastic IP | `$0.005/hour`, about `$3.65/month` |
| 24 GB gp3 root volume | `$0.0912/GB-month`, about `$2.19/month` |
| EC2 baseline subtotal | about `$15.33/month` before taxes |

Data transfer is unlikely to be the early cost driver. The app currently sends two 16 kHz mono PCM streams, system audio and mic, through the relay to Soniox. That is roughly 64 KB/s, about 230 MB per recording hour. AWS includes 100 GB/month of free data transfer out to the internet across most services, so this covers roughly 400+ recording hours/month before egress starts to matter. API usage dominates instead.

Current provider cost model:

| Workload | Estimate |
|---|---:|
| Soniox realtime STT, one stream | about `$0.12/hour` |
| Bartleby recording, two STT streams | about `$0.24/recording hour` |
| Upstage summaries/translations | usually cents per many hours, much smaller than STT |

Friend beta rule of thumb: **10 recording hours/user/month costs about `$2.50-$4.00` all-in** once API, retries, tiny infra share, and buffer are included. That is cheap enough for a friends beta if we cap usage.

## Relay surface

Minimum API surface:

```text
GET  /health
GET  /v1/stt/realtime        WebSocket proxy to Soniox realtime STT
POST /v1/summary/finalize    Upstage final meeting note proxy
POST /v1/translate           Upstage transcript translation proxy, only if live translation remains enabled
```

The app should never receive Notique's Soniox or Upstage keys. Keys live only on the server, loaded from SSM Parameter Store or `/etc/bartleby-relay.env` with root-only permissions.

## Security and privacy rules

- Require a private beta token on every request.
- Prefer per-user invite tokens over one shared token once more than a few friends test it.
- Enforce usage caps server-side: max recording hours/month, max concurrent sessions, max session length.
- Do not log raw audio, transcripts, summaries, or provider keys.
- Log only operational metadata: user id/token id, session id, started/stopped, duration seconds, provider error class, byte counts.
- Add a kill switch that rejects hosted API calls while leaving BYOK usable.
- Show explicit onboarding copy when hosted mode is selected: audio/transcript data is routed through Notique's relay and then to Soniox/Upstage.

## EC2 deployment shape

Recommended layout on the shared `notique-agent` host:

```text
notique-agent shared EC2 host
  → api.heybartleby.com DNS A record to 3.37.71.254
  → EC2 security group 80/443 inbound
  → Caddy or nginx TLS reverse proxy with host-based routing
  → 127.0.0.1:8787 bartleby-relay systemd service
  → Soniox / Upstage outbound HTTPS/WSS
```


Naming convention on the shared host:

| Resource | Name | Why |
|---|---|---|
| EC2 instance | `notique-agent` | Shared Notique box. Keep stable. |
| DNS | `api.heybartleby.com` | Public API endpoint users/apps see. |
| systemd service | `bartleby-relay.service` | Clear process ownership on the shared host. |
| app directory | `/opt/notique/bartleby-relay` | Keeps Notique services grouped but separated. |
| local user | `bartleby` | Least-privilege runtime user for the relay. |
| logs | `journalctl -u bartleby-relay` | Easy ops/debug command. |
| env file fallback | `/etc/bartleby-relay.env` | Root-only fallback if SSM injection is not ready. |

The EC2 `Name` tag can remain `notique-agent`. If extra AWS tags are useful, add non-owning tags such as `Service=bartleby-relay` or `Product=Bartleby`; do not replace existing tags that may be used for other Notique workflows.

Use SSM for deployment and emergency access. Avoid opening SSH broadly.

Required one-time AWS changes:

```sh
# allow HTTPS and HTTP for TLS issuance; keep SSH restricted
aws ec2 authorize-security-group-ingress \
  --region ap-northeast-2 \
  --group-id sg-010657af2d60741d7 \
  --ip-permissions \
    IpProtocol=tcp,FromPort=80,ToPort=80,IpRanges='[{CidrIp=0.0.0.0/0,Description="HTTP for TLS challenge"}]' \
    IpProtocol=tcp,FromPort=443,ToPort=443,IpRanges='[{CidrIp=0.0.0.0/0,Description="Bartleby hosted API HTTPS"}]'
```

Store secrets outside git:

```sh
aws ssm put-parameter --region ap-northeast-2 --name /bartleby/prod/SONIOX_API_KEY --type SecureString --value '...'
aws ssm put-parameter --region ap-northeast-2 --name /bartleby/prod/UPSTAGE_API_KEY --type SecureString --value '...'
aws ssm put-parameter --region ap-northeast-2 --name /bartleby/prod/BETA_TOKEN --type SecureString --value '...'
```

## App changes required

1. Add provider mode preference:
   - `hosted` for friends beta default.
   - `byok` for direct Soniox/Upstage keys.
2. Onboarding:
   - Step 1: choose hosted beta or BYOK.
   - Step 2: hosted invite token or BYOK keys.
   - Step 3: microphone permission.
   - Step 4: screen/system audio permission.
   - Step 5: test recording.
3. Settings:
   - Show current mode clearly.
   - Show remaining hosted minutes when metering endpoint exists.
   - Keep BYOK key fields, but hide them behind advanced mode when hosted is selected.
4. Rust networking:
   - Abstract STT and Upstage calls behind provider clients.
   - Direct BYOK client keeps current code path.
   - Hosted client calls Notique relay and never sees provider keys.
5. Privacy copy:
   - Current BYOK copy remains true only for BYOK mode.
   - Hosted mode must say provider calls go through Notique's relay.

## Rollout plan

### Phase H0, docs and decision lock

- Document this hosted beta decision.
- Keep public v0.1.1 copy as BYOK until code ships.
- Confirm EC2 target and cost ceiling.

### Phase H1, relay MVP

- Build `bartleby-relay` with `/health`, Soniox WebSocket proxy, Upstage summary proxy, bearer-token auth, and no content logging.
- Add duration metering in server logs.
- Run locally against current app test keys.

### Phase H2, EC2 deploy

- Deploy relay as `bartleby-relay.service` on the shared `notique-agent` host using SSM.
- Add DNS `api.heybartleby.com`.
- Add TLS reverse proxy.
- Verify WebSocket upgrade and provider calls from a clean Mac.

### Phase H3, app hosted mode

- Add hosted/BYOK mode switch.
- Update onboarding and Settings.
- Keep direct BYOK path as fallback.
- Ship a signed private beta DMG.

### Phase H4, quota and beta operations

- Add per-token monthly minute cap.
- Add max concurrent sessions.
- Add emergency disable flag.
- Review first 5-10 friends' usage before public pricing.

## Stop conditions

Do not offer public hosted API until all are true:

- Server-side usage caps exist.
- Hosted privacy/terms copy is live.
- Notique provider keys are not present in the app bundle or logs.
- Relay logs prove actual cost per recording hour for at least 10 real sessions.
- BYOK fallback still works.
