import React from "react";

const clampPercent = (value) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value));
};

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const LoadingDebugBar = ({
  visible = false,
  status = "idle",
  label = "Loading model",
  progress = 0,
  loadedBytes,
  totalBytes,
  error = "",
  messages = [],
  showProgress = true,
}) => {
  if (!visible) {
    return null;
  }

  const percent = clampPercent(progress);
  const displayPercent = Math.round(percent);
  const byteInfo =
    Number.isFinite(loadedBytes) && Number.isFinite(totalBytes) && totalBytes > 0
      ? `${formatBytes(loadedBytes)} / ${formatBytes(totalBytes)}`
      : Number.isFinite(loadedBytes)
        ? `${formatBytes(loadedBytes)}`
        : "";

  const statusText =
    status === "error"
      ? "error"
      : status === "loaded"
        ? "ready"
        : "loading";

  return (
    <div className="pointer-events-none absolute left-0 top-0 z-50 w-full px-3 pt-3">
      <div className="pointer-events-auto rounded-xl border border-white/60 bg-black/55 p-2 text-white backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
          <span className="truncate">{label}</span>
          <span className="shrink-0 uppercase">{statusText}</span>
        </div>
        {showProgress ? (
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className={`h-full ${status === "error" ? "bg-red-400" : "bg-white"}`}
              style={{ width: `${displayPercent}%` }}
            />
          </div>
        ) : null}
        <div className="mt-1 flex items-center justify-between gap-2 text-[11px] sm:text-xs text-white/90">
          <span>{status === "error" ? error || "load failed" : byteInfo}</span>
          <span className="shrink-0">{displayPercent}%</span>
        </div>
        {messages.length > 0 ? (
          <div className="mt-2 max-h-24 overflow-y-auto rounded border border-white/20 bg-black/30 px-2 py-1 text-[10px] sm:text-xs text-white/85">
            {messages.slice(-4).map((message, index) => (
              <div key={`${message}-${index}`} className="truncate">
                {message}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default LoadingDebugBar;
