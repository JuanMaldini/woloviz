import * as THREE from "three";
import { BsCircle, BsCircleFill } from "react-icons/bs";

const createOverwriteSceneMaterial = () =>
  new THREE.MeshStandardMaterial({
    color: 0xcfcfcf,
    roughness: 0.55,
    metalness: 0,
    side: THREE.FrontSide,
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

export const createOverwriteToggleHandler = ({
  overwriteEnabledRef,
  setOverwriteEnabled,
  overwriteMaterialControllerRef,
}) => {
  return () => {
    const nextValue = !overwriteEnabledRef.current;
    overwriteEnabledRef.current = nextValue;
    setOverwriteEnabled(nextValue);
    overwriteMaterialControllerRef.current?.setEnabled(nextValue);
  };
};

export const OverwriteMaterialToggle = ({
  enabled = false,
  onToggle,
  disabled = false,
}) => (
  <button
    type="button"
    onClick={onToggle}
    disabled={disabled}
    aria-label={
      enabled ? "Overwrite material enabled" : "Overwrite material disabled"
    }
    title={enabled ? "Overwrite material: ON" : "Overwrite material: OFF"}
    className="inline-flex h-8 w-8 items-center justify-center rounded border border-black/15 bg-white text-black/55 transition-colors hover:bg-black/[0.04] hover:text-black/75 disabled:pointer-events-none disabled:opacity-30 sm:h-10 sm:w-10"
  >
    {enabled ? (
      <BsCircleFill className="h-4 w-4 sm:h-5 sm:w-5" />
    ) : (
      <BsCircle className="h-4 w-4 sm:h-5 sm:w-5" />
    )}
  </button>
);
