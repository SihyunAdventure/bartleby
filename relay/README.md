# Bartleby Relay

Hosted API relay for the friends beta. It keeps Notique-owned Soniox and Upstage keys on the server while preserving BYOK as the app fallback.

## Endpoints

- `GET /health`, unauthenticated health check.
- `GET /v1/stt/realtime`, WebSocket proxy to Soniox `stt-rt-v4`.
- `POST /v1/summary/finalize`, Upstage `solar-pro3` final note proxy.
- `POST /v1/translate`, Upstage `solar-pro3` translation proxy. Add `?stream=1` to pass through SSE.

All `/v1/*` routes require `Authorization: Bearer <beta-token>` or `x-bartleby-token: <beta-token>`.

## Local run

```sh
cd relay
npm install
cp .env.example .env
# fill .env, then:
set -a; . ./.env; set +a
npm test
npm start
```

## EC2 service names

- Shared host: `notique-agent`
- systemd: `bartleby-relay.service`
- directory: `/opt/notique/bartleby-relay`
- runtime user: `bartleby`
- logs: `journalctl -u bartleby-relay -f`

Do not log raw audio, transcripts, summaries, or provider keys.


## Live beta endpoint

`https://api.heybartleby.com` is deployed on the shared `notique-agent` EC2 host.

Quick checks:

```sh
curl https://api.heybartleby.com/health
journalctl -u bartleby-relay -f
```

Secrets are stored in AWS SSM Parameter Store under `/bartleby/prod/*` and rendered into `/etc/bartleby-relay.env` during deployment. Do not commit or print that env file.
