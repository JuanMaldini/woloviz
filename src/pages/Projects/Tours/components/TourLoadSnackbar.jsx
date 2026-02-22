const toMbLabel = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const TourLoadSnackbar = ({
  visible = false,
  loadedBytes = 0,
  totalBytes = 0,
  completedFiles = 0,
  totalFiles = 0,
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
  const fallbackPercent =
    totalFiles > 0
      ? Math.max(0, Math.min(100, (completedFiles / totalFiles) * 100))
      : 0;
  const progressPercent =
    normalizedTotal > 0
      ? Math.max(0, Math.min(100, (normalizedLoaded / normalizedTotal) * 100))
      : fallbackPercent;

  const statusText = hasError
    ? `Error de carga (${completedFiles}/${totalFiles || 0})`
    : `${toMbLabel(normalizedLoaded)} / ${
        normalizedTotal > 0 ? toMbLabel(normalizedTotal) : "-- MB"
      } (${completedFiles}/${totalFiles || 0})`;

  return (
    <div className="tour-load-snackbar" role="status" aria-live="polite">
      <div className="tour-load-snackbar__content">
        <div className="tour-load-snackbar__track">
          <div
            className="tour-load-snackbar__fill"
            style={{ width: `${hasError ? 100 : progressPercent}%` }}
          />
        </div>
        <span className="tour-load-snackbar__text">{statusText}</span>
      </div>
    </div>
  );
};

export default TourLoadSnackbar;
