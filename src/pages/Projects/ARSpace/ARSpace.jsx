import React from "react";
import { Unity, useUnityContext } from "react-unity-webgl";

const ARSpace = () => {
  const { unityProvider, loadingProgression, isLoaded } = useUnityContext({
    loaderUrl: "unity/unity.loader.js",
    dataUrl: "unity/unity.data.unityweb",
    frameworkUrl: "unity/unity.framework.js.unityweb",
    codeUrl: "unity/unity.wasm.unityweb",
  });

  return (
    <Fragment>
      {!isLoaded && (
        <p>Loading Application... {Math.round(loadingProgression * 100)}%</p>
      )}
      <Unity
        unityProvider={unityProvider}
        style={{ visibility: isLoaded ? "visible" : "hidden" }}
      />
    </Fragment>
  );
}

export default ARSpace;
