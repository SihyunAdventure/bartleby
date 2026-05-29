# Bartleby model surface

Public builds should expose only the models below. There are no bundled local
STT/LLM model files in the app, and Bartleby should not silently download
open-source models on install.

Provider access has two planned modes:

- **BYOK direct**, active in v0.1.1: the app calls Soniox and Upstage with keys stored in macOS Keychain.
- **Notique-hosted relay**, planned for friends beta: the app calls `api.heybartleby.com`, and the relay calls Soniox/Upstage with Notique-owned keys. BYOK remains the fallback.

| Layer | Active provider/model | Key | Data sent |
|---|---|---|---|
| Speech-to-text | Soniox `stt-rt-v4` realtime streaming | BYOK `SONIOX_API_KEY` or hosted relay server key | System audio + microphone audio chunks |
| Korean notes | Upstage `solar-pro3` direct API | BYOK `UPSTAGE_API_KEY` or hosted relay server key | End-of-session transcript text |

Not active in the public model surface:

- OpenRouter
- Whisper / Ollama / local STT models
- Claude / Gemini / GPT fallback models
- Any bundled or auto-installed open-source model weights

If local/open-source models are added later, they must be an explicit opt-in
download with size, source, license, version, and SHA-256 verification shown
before installation.

## Hosted relay rule

If hosted mode is enabled, Notique provider keys must stay server-side only. They must never be bundled in the Tauri app, written to frontend config, exposed through logs, or returned to the client. The app should authenticate to the relay with a beta token or user token, not with Soniox/Upstage credentials.

See [HOSTED_API.md](./HOSTED_API.md) for the EC2 relay plan.
