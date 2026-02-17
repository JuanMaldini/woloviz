import * as THREE from "three";

const DEFAULT_MIN_DISTANCE = 2;
const DEFAULT_MAX_DISTANCE = 6000;
const DEFAULT_WHEEL_SPEED = 0.0015;

const toFiniteNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const resolveZoomLimits = ({ minDistance, maxDistance }) => {
  const resolvedMin = Math.max(
    0,
    toFiniteNumber(minDistance) ?? DEFAULT_MIN_DISTANCE,
  );
  const resolvedMax = Math.max(
    resolvedMin,
    toFiniteNumber(maxDistance) ?? DEFAULT_MAX_DISTANCE,
  );

  return {
    minDistance: resolvedMin,
    maxDistance: resolvedMax,
  };
};

export const clampOrbitDistance = ({ distance, minDistance, maxDistance }) => {
  const limits = resolveZoomLimits({ minDistance, maxDistance });
  const safeDistance = Math.max(
    limits.minDistance,
    toFiniteNumber(distance) ?? limits.minDistance,
  );

  return THREE.MathUtils.clamp(
    safeDistance,
    limits.minDistance,
    limits.maxDistance,
  );
};

export const getOrbitDistance = ({ camera, target }) => {
  if (!camera?.position || !target) {
    return DEFAULT_MIN_DISTANCE;
  }

  const distance = camera.position.distanceTo(target);
  return Number.isFinite(distance) && distance > 0
    ? distance
    : DEFAULT_MIN_DISTANCE;
};

export const resolveSlideOrbitDistance = ({
  slideDistance,
  camera,
  target,
  minDistance,
  maxDistance,
}) => {
  const parsedSlideDistance = toFiniteNumber(slideDistance);
  const fallbackDistance = getOrbitDistance({ camera, target });

  return clampOrbitDistance({
    distance: parsedSlideDistance ?? fallbackDistance,
    minDistance,
    maxDistance,
  });
};

export const setOrbitDistance = ({
  camera,
  target,
  nextDistance,
  minDistance,
  maxDistance,
}) => {
  if (!camera?.position || !target) {
    return null;
  }

  const clampedDistance = clampOrbitDistance({
    distance: nextDistance,
    minDistance,
    maxDistance,
  });

  const lookDirection = camera.position.clone().sub(target);
  if (lookDirection.lengthSq() < 1e-9) {
    lookDirection.set(0, 0, 1);
  } else {
    lookDirection.normalize();
  }

  camera.position.copy(
    target.clone().add(lookDirection.multiplyScalar(clampedDistance)),
  );

  return clampedDistance;
};

export const applyOrbitWheelZoom = ({
  camera,
  target,
  deltaY,
  minDistance,
  maxDistance,
  speed = DEFAULT_WHEEL_SPEED,
}) => {
  const currentDistance = getOrbitDistance({ camera, target });
  const zoomScale = Math.exp(Number(deltaY || 0) * speed);
  const nextDistance = currentDistance * zoomScale;

  return setOrbitDistance({
    camera,
    target,
    nextDistance,
    minDistance,
    maxDistance,
  });
};

export const applyOrbitPinchZoom = ({
  camera,
  target,
  previousPinchDistance,
  pinchDistance,
  minDistance,
  maxDistance,
}) => {
  const prevDistance = toFiniteNumber(previousPinchDistance);
  const nextPinchDistance = toFiniteNumber(pinchDistance);

  if (
    !prevDistance ||
    !nextPinchDistance ||
    prevDistance <= 0 ||
    nextPinchDistance <= 0
  ) {
    return null;
  }

  const currentDistance = getOrbitDistance({ camera, target });
  const zoomScale = prevDistance / nextPinchDistance;
  const nextDistance = currentDistance * zoomScale;

  return setOrbitDistance({
    camera,
    target,
    nextDistance,
    minDistance,
    maxDistance,
  });
};
