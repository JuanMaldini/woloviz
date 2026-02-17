import * as THREE from "three";

const toRoundedValue = (value) => Number(Number(value || 0).toFixed(3));

export const toRotationFromDirection = (direction) => {
  const vector = new THREE.Vector3(
    Number(direction?.x || 0),
    Number(direction?.y || 0),
    Number(direction?.z || -1),
  );

  if (vector.lengthSq() < 1e-6) {
    vector.set(0, 0, -1);
  } else {
    vector.normalize();
  }

  const lookMatrix = new THREE.Matrix4().lookAt(
    new THREE.Vector3(0, 0, 0),
    vector,
    new THREE.Vector3(0, 1, 0),
  );
  const euler = new THREE.Euler().setFromRotationMatrix(lookMatrix, "YXZ");

  return {
    x: toRoundedValue(euler.x),
    y: toRoundedValue(euler.y),
    z: toRoundedValue(euler.z),
  };
};

export const createCurrentPlayerSlide = (currentPose) => {
  if (!currentPose?.position) {
    return null;
  }

  const distanceValue = Number(currentPose?.distance);

  return {
    title: "current",
    position: {
      x: toRoundedValue(currentPose.position?.x),
      y: toRoundedValue(currentPose.position?.y),
      z: toRoundedValue(currentPose.position?.z),
    },
    rotation: toRotationFromDirection(currentPose.lookDirection),
    distance: Number.isFinite(distanceValue)
      ? toRoundedValue(Math.max(0, distanceValue))
      : undefined,
  };
};
