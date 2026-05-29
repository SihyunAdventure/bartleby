import React from "react";
import ReactDOM from "react-dom/client";
// tokens.css must load BEFORE App.css — overlay transparency depends on
// App.css's `html, body, #root { background: transparent }` winning specificity
// over tokens.css's `body { background: var(--bg-page) }`.
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/components.css";
import App from "./App";
import DictationOverlay from "./dictation/Overlay";

// The dictation overlay runs in its own window (label "dictation", ?dictation).
// Render ONLY the overlay there — not the full App — so the meeting app's
// startup effects (analytics, updater, session load) don't double-fire in the
// second window.
const isDictation = new URLSearchParams(window.location.search).has("dictation");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>{isDictation ? <DictationOverlay /> : <App />}</React.StrictMode>,
);
