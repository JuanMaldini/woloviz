import { createCurrentPlayerSlide } from "./pose";
import * as THREE from "three";

const toFixedNumber = (value, decimals = 3) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Number(numeric.toFixed(decimals));
};

export const buildCurrentSlideTemplate = ({
  currentPose,
  currentPlayerSlide,
  activeSlideTitle,
}) => {
  const resolvedCurrentSlide =
    currentPlayerSlide ?? createCurrentPlayerSlide(currentPose);

  if (!resolvedCurrentSlide?.position || !resolvedCurrentSlide?.rotation) {
    return null;
  }

  return {
    title:
      typeof activeSlideTitle === "string" && activeSlideTitle.trim()
        ? activeSlideTitle.trim()
        : "current",
    position: {
      x: toFixedNumber(resolvedCurrentSlide.position?.x),
      y: toFixedNumber(resolvedCurrentSlide.position?.y),
      z: toFixedNumber(resolvedCurrentSlide.position?.z),
    },
    rotation: {
      x: toFixedNumber(resolvedCurrentSlide.rotation?.x),
      y: toFixedNumber(resolvedCurrentSlide.rotation?.y),
      z: toFixedNumber(resolvedCurrentSlide.rotation?.z),
    },
    distance: Number.isFinite(Number(resolvedCurrentSlide?.distance))
      ? toFixedNumber(resolvedCurrentSlide.distance)
      : undefined,
  };
};

export const toCarouselItemString = (slide) => {
  if (!slide?.position || !slide?.rotation) {
    return "";
  }

  const title =
    typeof slide.title === "string" && slide.title.trim()
      ? slide.title.trim()
      : "current";

  return [
    "  {",
    `    title: ${JSON.stringify(title)},`,
    `    position: { x: ${slide.position.x}, y: ${slide.position.y}, z: ${slide.position.z} },`,
    `    rotation: { x: ${slide.rotation.x}, y: ${slide.rotation.y}, z: ${slide.rotation.z} },`,
    ...(Number.isFinite(slide.distance)
      ? [`    distance: ${slide.distance},`]
      : []),
    "  },",
  ].join("\n");
};

export const copyCurrentSlideToClipboard = async ({
  currentPose,
  currentPlayerSlide,
  activeSlideTitle,
}) => {
  const slideTemplate = buildCurrentSlideTemplate({
    currentPose,
    currentPlayerSlide,
    activeSlideTitle,
  });

  if (!slideTemplate) {
    return false;
  }

  const payload = toCarouselItemString(slideTemplate);
  if (!payload) {
    return false;
  }

  await navigator.clipboard.writeText(payload);
  return true;
};

export const resolveOrbitCurrentPose = ({ camera, orbitControls }) => {
  if (!camera || !orbitControls) {
    return null;
  }

  const lookDirection = orbitControls.target.clone().sub(camera.position);
  if (lookDirection.lengthSq() < 1e-6) {
    camera.getWorldDirection(lookDirection);
  } else {
    lookDirection.normalize();
  }

  return {
    position: {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
    },
    lookDirection: {
      x: lookDirection.x,
      y: lookDirection.y,
      z: lookDirection.z,
    },
    distance: camera.position.distanceTo(orbitControls.target),
  };
};

export const resolvePointerLockCurrentPose = ({
  camera,
  pointerLockControls,
}) => {
  if (!camera || !pointerLockControls) {
    return null;
  }

  const lookDirection = new THREE.Vector3();
  camera.getWorldDirection(lookDirection);

  return {
    position: {
      x: pointerLockControls.object.position.x,
      y: pointerLockControls.object.position.y,
      z: pointerLockControls.object.position.z,
    },
    lookDirection: {
      x: lookDirection.x,
      y: lookDirection.y,
      z: lookDirection.z,
    },
  };
};

export const resolveCurrentPoseByMode = ({
  mode,
  cameraRef,
  orbitControlsRef,
  pointerLockControlsRef,
}) => {
  const camera = cameraRef?.current;

  if (mode === "orbit") {
    return resolveOrbitCurrentPose({
      camera,
      orbitControls: orbitControlsRef?.current,
    });
  }

  if (mode === "pointer-lock") {
    return resolvePointerLockCurrentPose({
      camera,
      pointerLockControls: pointerLockControlsRef?.current,
    });
  }

  return null;
};
