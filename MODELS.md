# Bartleby model surface

Public builds should expose only the models below. There are no bundled local
STT/LLM model files in the app, and Bartleby should not silently download
open-source models on install.

| Layer | Active provider/model | Key | Data sent |
|---|---|---|---|
| Speech-to-text | Soniox `stt-rt-v4` realtime streaming | `SONIOX_API_KEY` | System audio + microphone audio chunks |
| Korean translation | Upstage `solar-pro3` direct API | `UPSTAGE_API_KEY` | Finalized transcript text |
| Final note | Upstage `solar-pro3` direct API | `UPSTAGE_API_KEY` | End-of-session transcript text |

Not active in the public model surface:

- OpenRouter
- Whisper / Ollama / local STT models
- Claude / Gemini / GPT fallback models
- Any bundled or auto-installed open-source model weights

If local/open-source models are added later, they must be an explicit opt-in
download with size, source, license, version, and SHA-256 verification shown
before installation.
