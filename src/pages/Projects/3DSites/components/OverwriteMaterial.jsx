import * as THREE from "three";
import { BsCircle, BsCircleFill } from "react-icons/bs";

const OVERWRITE_GRAY_COLOR = 0xb4b4b4;

const createOverwriteSceneMaterial = () =>
  new THREE.MeshStandardMaterial({
    color: OVERWRITE_GRAY_COLOR,
    roughness: 1,
    metalness: 0,
    side: THREE.DoubleSide,
  });

export const createOverwriteMaterialController = () => {
  let scene = null;
  let enabled = false;
  const overwriteMaterial = createOverwriteSceneMaterial();

  const apply = () => {
    if (!scene) {
      return;
    }

    scene.overrideMaterial = enabled ? overwriteMaterial : null;
  };

  return {
    setScene(nextScene) {
      if (scene === nextScene) {
        apply();
        return;
      }

      if (scene) {
        scene.overrideMaterial = null;
      }

      scene = nextScene;
      apply();
    },

    setEnabled(nextEnabled) {
      enabled = Boolean(nextEnabled);
      apply();
    },

    isEnabled() {
      return enabled;
    },

    dispose() {
      if (scene) {
        scene.overrideMaterial = null;
      }
      scene = null;
      overwriteMaterial.dispose();
    },
  };
};

export const OverwriteMaterialToggle = ({ enabled = false, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={
      enabled ? "Overwrite material enabled" : "Overwrite material disabled"
    }
    title={enabled ? "Overwrite material: ON" : "Overwrite material: OFF"}
    className="inline-flex h-8 w-8 items-center justify-center rounded border border-black/35 bg-white text-black/85 shadow-sm transition-colors hover:bg-black/10"
  >
    {enabled ? (
      <BsCircleFill className="h-4 w-4" />
    ) : (
      <BsCircle className="h-4 w-4" />
    )}
  </button>
);