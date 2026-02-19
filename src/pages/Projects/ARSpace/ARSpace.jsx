import { Unity, useUnityContext } from "react-unity-webgl";

const ARSpace = () => {
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
  });

  const loadingProgress = Math.round(loadingProgression * 100);

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
