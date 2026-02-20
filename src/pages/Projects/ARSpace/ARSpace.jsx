import React from "react";
import { Unity, useUnityContext } from "react-unity-webgl";

const ARSpace = () => {
  const { unityProvider, loadingProgression, isLoaded } = useUnityContext({
    loaderUrl: "/unity/Build/unity.loader.js",
    dataUrl: "/unity/Build/unity.data.unityweb",
    frameworkUrl: "/unity/Build/unity.framework.js.unityweb",
    codeUrl: "/unity/Build/unity.wasm.unityweb",
  });


  return (
    <div className="flex min-h-full w-full flex-1 flex-col items-center justify-center bg-gray-100">
      {!isLoaded && (
        <p>Loading Application... {Math.round(loadingProgression * 100)}%</p>
      )}
      <Unity
        unityProvider={unityProvider}
        style={{ visibility: isLoaded ? "visible" : "hidden" }}
      />
    </div>
  );
};

export default ARSpace;
