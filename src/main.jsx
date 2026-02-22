import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from "./pages/App/App";

const CHUNK_RELOAD_KEY = "__woloviz_chunk_reload_once__";
const CHUNK_ERROR_PATTERNS = [
  /ChunkLoadError/i,
  /Loading chunk [\d]+ failed/i,
  /Failed to fetch dynamically imported module/i,
];

function shouldRecoverFromChunkError(value) {
  const message = typeof value === "string" ? value : "";
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

function reloadOnceForChunkError() {
  if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1") {
    return;
  }

  sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
  window.location.reload();
}

window.addEventListener("error", (event) => {
  const errorMessage = event?.error?.message ?? event?.message ?? "";
  if (shouldRecoverFromChunkError(errorMessage)) {
    reloadOnceForChunkError();
  }
});

window.addEventListener("unhandledrejection", (event) => {
  const reason = event?.reason;
  const reasonMessage =
    typeof reason === "string" ? reason : (reason?.message ?? "");

  if (shouldRecoverFromChunkError(reasonMessage)) {
    reloadOnceForChunkError();
  }
});

window.addEventListener(
  "load",
  () => {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  },
  { once: true },
);

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container #root not found in document");
}

createRoot(container).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <App />
    </BrowserRouter>
    <Analytics />
    <SpeedInsights />
  </React.StrictMode>,
);
