import { useState, useEffect, useRef } from "react";

const ARSpace = () => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const unityInstanceRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let script = null;
    let isMounted = true;

    const initUnity = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Detect mobile
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      const buildUrl = "/App/Build";
      const loaderUrl = `${buildUrl}/App.loader.js`;

      const config = {
        dataUrl: `${buildUrl}/App.data.gz`,
        frameworkUrl: `${buildUrl}/App.framework.js.gz`,
        codeUrl: `${buildUrl}/App.wasm.gz`,
        matchWebGLToCanvasSize: true,
      };

      // Adjust for mobile if needed
      if (isMobile) {
        config.devicePixelRatio = window.devicePixelRatio || 1;
      }

      script = document.createElement("script");
      script.src = loaderUrl;
      script.async = true;

      script.onload = () => {
        if (!isMounted) return;

        // createUnityInstance is added to window by the loader script
        if (typeof window.createUnityInstance === "function") {
          window
            .createUnityInstance(canvas, config, (progress) => {
              if (isMounted) {
                setLoadingProgress(Math.round(progress * 100));
              }
            })
            .then((unityInstance) => {
              if (isMounted) {
                unityInstanceRef.current = unityInstance;
                setIsLoaded(true);
                setLoadingProgress(100);
              } else {
                // Component unmounted before load completed
                unityInstance.Quit();
              }
            })
            .catch((message) => {
              if (isMounted) {
                console.error("Unity loader error:", message);
                setError(message);
              }
            });
        } else {
          if (isMounted) {
            setError("Unity loader not available");
          }
        }
      };

      script.onerror = () => {
        if (isMounted) {
          setError("Failed to load Unity loader script");
        }
      };

      document.body.appendChild(script);
    };

    initUnity();

    return () => {
      isMounted = false;

      // Cleanup Unity instance
      if (unityInstanceRef.current) {
        try {
          unityInstanceRef.current.Quit();
        } catch (e) {
          console.error("Error quitting Unity instance:", e);
        }
        unityInstanceRef.current = null;
      }

      // Cleanup script
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const handleFullscreen = () => {
    if (unityInstanceRef.current) {
      unityInstanceRef.current.SetFullscreen(1);
    }
  };

  return (
    <div className="flex min-h-full w-full flex-1 flex-col bg-gray-900">
      {/* Unity Canvas Container */}
      <div className="relative flex h-full w-full flex-1 items-center justify-center">
        <canvas
          ref={canvasRef}
          id="unity-canvas"
          className="h-full w-full"
          tabIndex={-1}
        />

        {/* Loading Progress Bar */}
        {!isLoaded && !error && (
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
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="max-w-md rounded-lg bg-red-900/20 p-6 text-center">
              <div className="mb-2 text-lg font-semibold text-red-400">
                Error Loading Unity App
              </div>
              <div className="text-sm text-red-300">{error}</div>
            </div>
          </div>
        )}

        {/* Fullscreen Button */}
        {isLoaded && !error && (
          <button
            onClick={handleFullscreen}
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
