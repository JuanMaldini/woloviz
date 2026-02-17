const toMbLabel = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const LoaderViewer = ({
  visible = false,
  loadedBytes = 0,
  totalBytes = 0,
  hasError = false,
}) => {
  if (!visible) {
    return null;
  }

  const normalizedLoaded = Number.isFinite(loadedBytes)
    ? Math.max(0, loadedBytes)
    : 0;
  const normalizedTotal = Number.isFinite(totalBytes)
    ? Math.max(0, totalBytes)
    : 0;
  const progressPercent =
    normalizedTotal > 0
      ? Math.max(0, Math.min(100, (normalizedLoaded / normalizedTotal) * 100))
      : 0;

  const statusText = hasError
    ? "error"
    : `${toMbLabel(normalizedLoaded)} / ${
        normalizedTotal > 0 ? toMbLabel(normalizedTotal) : "-- MB"
      }`;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40">
      <div className="flex h-8 w-full items-center gap-3 border-b border-black/10 bg-white/80 px-3">
        <div className="h-1.5 flex-1 overflow-hidden bg-black/10">
          <div
            className="h-full bg-black/40 transition-[width] duration-150 ease-out"
            style={{ width: `${hasError ? 100 : progressPercent}%` }}
          />
        </div>
        <span className="text-xs text-black/70 tabular-nums">{statusText}</span>
      </div>
    </div>
  );
};

export default LoaderViewer;
