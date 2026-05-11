import React from "react";
import ReactDOM from "react-dom/client";
// tokens.css must load BEFORE App.css — overlay transparency depends on
// App.css's `html, body, #root { background: transparent }` winning specificity
// over tokens.css's `body { background: var(--bg-page) }`.
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/components.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
