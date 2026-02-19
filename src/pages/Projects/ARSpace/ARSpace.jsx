import { useEffect, useState } from "react";
import { Unity, useUnityContext } from "react-unity-webgl";

const ARSpace = () => {
  const [isLikelyStalled, setIsLikelyStalled] = useState(false);
  const [diagnosticLogs, setDiagnosticLogs] = useState([]);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const {
    unityProvider,
    loadingProgression,
    isLoaded,
    requestFullscreen,
    initializationError,
  } = useUnityContext({
    loaderUrl: "/App/Build/App.loader.js",
    dataUrl: "/App/Build/App.data.gz",
    frameworkUrl: "/App/Build/App.framework.js.gz",
    codeUrl: "/App/Build/App.wasm.gz",
    devicePixelRatio: isMobile ? 1 : window.devicePixelRatio || 1,
  });

  const loadingProgress = Math.round(loadingProgression * 100);

  const appendLog = (message) => {
    setDiagnosticLogs((previousLogs) => {
      const timestamp = new Date().toLocaleTimeString();
      const nextLogs = [...previousLogs, `[${timestamp}] ${message}`];
      return nextLogs.slice(-12);
    });
  };

  useEffect(() => {
    appendLog(
      `Init mobile=${isMobile} dpr=${isMobile ? 1 : window.devicePixelRatio || 1}`,
    );
  }, [isMobile]);

  useEffect(() => {
    const milestones = new Set([5, 25, 50, 75, 90, 95, 99, 100]);
    if (milestones.has(loadingProgress)) {
      appendLog(`Progress ${loadingProgress}%`);
    }
  }, [loadingProgress]);

  useEffect(() => {
    if (isLoaded) {
      appendLog("Unity loaded successfully");
    }
  }, [isLoaded]);

  useEffect(() => {
    if (initializationError?.message) {
      appendLog(`Init error: ${initializationError.message}`);
    }
  }, [initializationError]);

  useEffect(() => {
    const assetUrls = [
      "/App/Build/App.loader.js",
      "/App/Build/App.framework.js.gz",
      "/App/Build/App.wasm.gz",
      "/App/Build/App.data.gz",
    ];

    let isMounted = true;

    const checkAssets = async () => {
      for (const assetUrl of assetUrls) {
        try {
          const response = await fetch(assetUrl, {
            method: "HEAD",
            cache: "no-store",
          });
          if (!isMounted) {
            return;
          }

          const status = response.status;
          const contentType = response.headers.get("content-type") || "-";
          const contentEncoding =
            response.headers.get("content-encoding") || "-";
          const contentLength = response.headers.get("content-length") || "-";
          appendLog(
            `${assetUrl} -> ${status} | type=${contentType} | enc=${contentEncoding} | len=${contentLength}`,
          );
        } catch (error) {
          if (!isMounted) {
            return;
          }

          const normalizedError =
            error instanceof Error ? error.message : String(error);
          appendLog(`${assetUrl} -> network error: ${normalizedError}`);
        }
      }
    };

    checkAssets();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isLoaded || initializationError || loadingProgress < 90) {
      setIsLikelyStalled(false);
      return undefined;
    }

    const timer = setTimeout(() => {
      setIsLikelyStalled(true);
    }, 12000);

    return () => clearTimeout(timer);
  }, [isLoaded, initializationError, loadingProgress]);

  return (
    <div className="flex min-h-full w-full flex-1 flex-col bg-gray-900">
      {/* Unity Canvas Container */}
      <div className="relative flex h-full w-full flex-1 items-center justify-center">
        <Unity
          unityProvider={unityProvider}
          className="h-full w-full"
          tabIndex={-1}
        />

        {/* Loading Progress Bar */}
        {!isLoaded && !initializationError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="w-80 max-w-[90%]">
              <div className="mb-3 text-center text-sm font-medium text-white">
                Loading Unity App...
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <div className="mt-2 text-center text-xs text-gray-400">
                {loadingProgress}%
              </div>
              {isLikelyStalled && (
                <div className="mt-2 text-center text-xs text-amber-300">
                  Carga estancada cerca del 90%. Revisa los logs de diagnóstico
                  debajo.
                </div>
              )}
              <div className="mt-3 max-h-40 overflow-auto rounded border border-gray-700 bg-black/40 p-2 text-[11px] text-emerald-300">
                {diagnosticLogs.length === 0 ? (
                  <div>Esperando logs...</div>
                ) : (
                  diagnosticLogs.map((logLine, index) => (
                    <div key={`${index}-${logLine}`}>{logLine}</div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {initializationError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="max-w-md rounded-lg bg-red-900/20 p-6 text-center">
              <div className="mb-2 text-lg font-semibold text-red-400">
                Error Loading Unity App
              </div>
              <div className="text-sm text-red-300">
                {initializationError.message}
              </div>
              <div className="mt-3 max-h-40 overflow-auto rounded border border-red-800 bg-black/40 p-2 text-left text-[11px] text-rose-200">
                {diagnosticLogs.length === 0 ? (
                  <div>Esperando logs...</div>
                ) : (
                  diagnosticLogs.map((logLine, index) => (
                    <div key={`${index}-${logLine}`}>{logLine}</div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen Button */}
        {isLoaded && !initializationError && (
          <button
            onClick={() => requestFullscreen(true)}
            className="absolute bottom-4 right-4 rounded-lg bg-gray-800/80 p-3 text-white shadow-lg transition-all hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Fullscreen"
            aria-label="Toggle Fullscreen"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ARSpace;
