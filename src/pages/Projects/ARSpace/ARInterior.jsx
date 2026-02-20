import React, { useEffect, useMemo, useRef, useState } from "react";
import "@google/model-viewer";

const NOISELESS_GLB_URL = "/projects/Noiseless/noiseless.glb";
const INITIAL_HIDDEN_OBJECT_NAMES = [
  "Cieloraso",
  "TECHO_EXTERIOR",
  "Cylinder001",
  "Luz_poltrona",
  "Garganta_cocina_1_1",
  "Garganta_cocina_1_2",
  "Garganta_cocina_1",
  "Garganta_living",
  "Object025_1",
  "Object067_3",
  "Line022",
  "Line023",
];

const toMbLabel = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const ARInterior = () => {
  const modelViewerRef = useRef(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelLoadError, setModelLoadError] = useState(false);
  const [loadedBytes, setLoadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [progressFraction, setProgressFraction] = useState(0);
  const [arFailureMessage, setArFailureMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    const fetchContentLength = async () => {
      try {
        const headResponse = await fetch(NOISELESS_GLB_URL, { method: "HEAD" });
        const headLength = Number(
          headResponse.headers.get("content-length") || 0,
        );

        if (!ignore && Number.isFinite(headLength) && headLength > 0) {
          setTotalBytes(headLength);
          return;
        }

        const getResponse = await fetch(NOISELESS_GLB_URL, {
          method: "GET",
          headers: { Range: "bytes=0-0" },
        });
        const getLength = Number(
          getResponse.headers.get("content-length") || 0,
        );

        if (!ignore && Number.isFinite(getLength) && getLength > 0) {
          setTotalBytes(getLength);
        }
      } catch {
        if (!ignore) {
          setTotalBytes(0);
        }
      }
    };

    fetchContentLength();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const modelViewer = modelViewerRef.current;
    if (!modelViewer) {
      return undefined;
    }

    const applyInitialHideByNames = () => {
      try {
        const model = modelViewer.model;
        if (!model?.getMaterialByName) {
          return;
        }

        INITIAL_HIDDEN_OBJECT_NAMES.forEach((name) => {
          const material = model.getMaterialByName(name);
          if (!material) {
            return;
          }

          material.setAlphaMode("BLEND");
          if (material.pbrMetallicRoughness?.setBaseColorFactor) {
            const current = material.pbrMetallicRoughness.baseColorFactor || [
              1, 1, 1, 1,
            ];
            material.pbrMetallicRoughness.setBaseColorFactor([
              current[0] ?? 1,
              current[1] ?? 1,
              current[2] ?? 1,
              0,
            ]);
          }
        });
      } catch {
        // Best effort hide for model-viewer scene graph limitations.
      }
    };

    const handleProgress = (event) => {
      const totalProgress = Number(event?.detail?.totalProgress ?? 0);
      const normalized = Math.max(
        0,
        Math.min(1, Number.isFinite(totalProgress) ? totalProgress : 0),
      );

      setProgressFraction(normalized);

      if (totalBytes > 0) {
        setLoadedBytes(Math.round(totalBytes * normalized));
      } else {
        setLoadedBytes(0);
      }
    };

    const handleLoad = () => {
      setProgressFraction(1);
      if (totalBytes > 0) {
        setLoadedBytes(totalBytes);
      }
      setIsModelLoading(false);
      setModelLoadError(false);
      applyInitialHideByNames();
    };

    const handleError = () => {
      setModelLoadError(true);
      setIsModelLoading(false);
      setArFailureMessage(
        "No se pudo cargar el modelo (404 o recurso no disponible).",
      );
    };

    const handleArStatus = (event) => {
      const status = event?.detail?.status;
      if (status === "failed") {
        setArFailureMessage(
          "No se pudo iniciar AR en este dispositivo o modelo.",
        );
      } else if (status === "not-presenting" || status === "session-started") {
        setArFailureMessage("");
      }
    };

    modelViewer.addEventListener("progress", handleProgress);
    modelViewer.addEventListener("load", handleLoad);
    modelViewer.addEventListener("error", handleError);
    modelViewer.addEventListener("ar-status", handleArStatus);

    return () => {
      modelViewer.removeEventListener("progress", handleProgress);
      modelViewer.removeEventListener("load", handleLoad);
      modelViewer.removeEventListener("error", handleError);
      modelViewer.removeEventListener("ar-status", handleArStatus);
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

      {arFailureMessage ? (
        <div className="absolute left-1/2 top-14 z-30 -translate-x-1/2 rounded-lg border border-black/10 bg-white/90 px-3 py-2 text-xs text-black/80 shadow-sm">
          {arFailureMessage}
        </div>
      ) : null}

      <model-viewer
        ref={modelViewerRef}
        src={NOISELESS_GLB_URL}
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

export default ARInterior;
