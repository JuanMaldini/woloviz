import { useEffect, useState } from "react";

const AFRAME_SCRIPT_SRC = "https://aframe.io/releases/1.6.0/aframe.min.js";
const ARJS_SCRIPT_SRC = "https://raw.githack.com/AR-js-org/AR.js/3.4.7/aframe/build/aframe-ar.js";

const MARKER_CONFIG = {
  modelSrc: "/models/arm_chair__furniture.glb",
  position: "0 0 0",
  rotation: "0 0 0",
  scale: "0.12 0.12 0.12",
  arjs: "sourceType: webcam; videoTexture: true; debugUIEnabled: false;",
};

const loadScript = (src) =>
  new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src=\"${src}\"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }

      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`No se pudo cargar: ${src}`)), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true },
    );
    script.addEventListener("error", () => reject(new Error(`No se pudo cargar: ${src}`)), {
      once: true,
    });
    document.head.appendChild(script);
  });

const ARMarker01 = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        await loadScript(AFRAME_SCRIPT_SRC);
        await loadScript(ARJS_SCRIPT_SRC);

        if (!mounted) {
          return;
        }

        setIsReady(true);
        window.setTimeout(() => {
          window.dispatchEvent(new Event("resize"));
        }, 100);
      } catch {
        if (!mounted) {
          return;
        }

        setIsReady(false);
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="relative flex min-h-full w-full flex-1 flex-col overflow-hidden bg-gray-100">
      {isReady ? (
        <a-scene
          className="ar-marker-scene"
          embedded
          renderer="alpha: true; antialias: true; precision: medium;"
          vr-mode-ui="enabled: false"
          device-orientation-permission-ui="enabled: false"
          arjs={MARKER_CONFIG.arjs}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <a-marker preset="hiro" emitevents="true">
            <a-entity
              gltf-model={MARKER_CONFIG.modelSrc}
              position={MARKER_CONFIG.position}
              rotation={MARKER_CONFIG.rotation}
              scale={MARKER_CONFIG.scale}
            />
          </a-marker>

          <a-entity light="type: ambient; intensity: 0.9" />
          <a-entity light="type: directional; intensity: 0.8" position="1 2 1" />
          <a-entity camera />
        </a-scene>
      ) : null}
    </div>
  );
};

export default ARMarker01;
