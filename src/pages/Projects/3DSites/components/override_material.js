import * as THREE from "three";

export const OVERRIDE_MATERIAL_ENABLED = true;

export function createOverrideMaterial({
  enabled = OVERRIDE_MATERIAL_ENABLED,
  grayValue = 100,
} = {}) {
  if (!enabled) {
    return null;
  }

  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(grayValue / 255, grayValue / 255, grayValue / 255),
    roughness: 1,
    metalness: 0.0,
  });
}
