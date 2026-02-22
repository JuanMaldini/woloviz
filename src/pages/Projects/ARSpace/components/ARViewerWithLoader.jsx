import React, { useEffect, useMemo, useRef, useState } from "react";
import "@google/model-viewer";

const toMbLabel = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const ARViewerWithLoader = ({ modelSrc }) => {
  const modelViewerRef = useRef(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelLoadError, setModelLoadError] = useState(false);
  const [loadedBytes, setLoadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [progressFraction, setProgressFraction] = useState(0);

  useEffect(() => {
    let ignore = false;

    const resolveTotalBytes = async () => {
      try {
        const headResponse = await fetch(modelSrc, { method: "HEAD" });
        const headLength = Number(
          headResponse.headers.get("content-length") || 0,
        );

        if (!ignore && Number.isFinite(headLength) && headLength > 0) {
          setTotalBytes(headLength);
          return;
        }
      } catch {
        // Fall through to zero bytes mode.
      }

      if (!ignore) {
        setTotalBytes(0);
      }
    };

    setIsModelLoading(true);
    setModelLoadError(false);
    setLoadedBytes(0);
    setProgressFraction(0);
    resolveTotalBytes();

    return () => {
      ignore = true;
    };
  }, [modelSrc]);

  useEffect(() => {
    const modelViewer = modelViewerRef.current;
    if (!modelViewer) {
      return undefined;
    }

    const handleProgress = (event) => {
      const totalProgress = Number(event?.detail?.totalProgress ?? 0);
      const normalizedProgress = Math.max(
        0,
        Math.min(1, Number.isFinite(totalProgress) ? totalProgress : 0),
      );

      setProgressFraction(normalizedProgress);
      if (totalBytes > 0) {
        setLoadedBytes(Math.round(totalBytes * normalizedProgress));
      }
    };

    const handleLoad = () => {
      setProgressFraction(1);
      if (totalBytes > 0) {
        setLoadedBytes(totalBytes);
      }
      setIsModelLoading(false);
      setModelLoadError(false);
    };

    const handleError = () => {
      setIsModelLoading(false);
      setModelLoadError(true);
    };

    modelViewer.addEventListener("progress", handleProgress);
    modelViewer.addEventListener("load", handleLoad);
    modelViewer.addEventListener("error", handleError);

    return () => {
      modelViewer.removeEventListener("progress", handleProgress);
      modelViewer.removeEventListener("load", handleLoad);
      modelViewer.removeEventListener("error", handleError);
    };
  }, [totalBytes]);

  const progressPercent = useMemo(() => {
    if (totalBytes > 0) {
      return Math.max(0, Math.min(100, (loadedBytes / totalBytes) * 100));
    }

    return Math.max(0, Math.min(100, progressFraction * 100));
  }, [loadedBytes, totalBytes, progressFraction]);

  const statusText = useMemo(() => {
    if (modelLoadError) {
      return "error";
    }

    if (totalBytes > 0) {
      return `${toMbLabel(loadedBytes)} / ${toMbLabel(totalBytes)}`;
    }

    return `${progressPercent.toFixed(0)}% / -- MB`;
  }, [modelLoadError, loadedBytes, totalBytes, progressPercent]);

  const showLoader = isModelLoading || modelLoadError;

  return (
    <div className="relative flex min-h-full w-full flex-1 flex-col bg-gray-100">
      {showLoader ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-40">
          <div className="flex h-8 w-full items-center gap-3 border-b border-black/10 bg-white/80 px-3">
            <div className="h-1.5 flex-1 overflow-hidden bg-black/10">
              <div
                className="h-full bg-black/40 transition-[width] duration-150 ease-out"
                style={{ width: `${modelLoadError ? 100 : progressPercent}%` }}
              />
            </div>
            <span className="text-xs text-black/70 tabular-nums">
              {statusText}
            </span>
          </div>
        </div>
      ) : null}

      <model-viewer
        ref={modelViewerRef}
        src={modelSrc}
        ar
        ar-modes="webxr quick-look scene-viewer"
        camera-controls
        reveal="auto"
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "transparent",
        }}
      />
    </div>
  );
};

export default ARViewerWithLoader;
