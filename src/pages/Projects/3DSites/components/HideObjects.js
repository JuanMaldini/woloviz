const ensureClonedMaterial = (mesh) => {
  if (!mesh?.isMesh || mesh.userData.__hideObjectsMaterialCloned) {
    return;
  }

  if (Array.isArray(mesh.material)) {
    mesh.material = mesh.material.map((materialItem) =>
      materialItem?.clone ? materialItem.clone() : materialItem,
    );
  } else if (mesh.material?.clone) {
    mesh.material = mesh.material.clone();
  }

  mesh.userData.__hideObjectsMaterialCloned = true;
};

const applyInvisibleMaterial = (mesh) => {
  ensureClonedMaterial(mesh);

  if (Array.isArray(mesh.material)) {
    mesh.material.forEach((materialItem) => {
      if (!materialItem) {
        return;
      }

      materialItem.transparent = true;
      materialItem.opacity = 0;
      materialItem.depthWrite = false;
      materialItem.needsUpdate = true;
    });

    mesh.userData.__hiddenByHideObjects = true;
    mesh.raycast = () => null;
    mesh.visible = false;
    return;
  }

  if (!mesh.material) {
    mesh.userData.__hiddenByHideObjects = true;
    mesh.raycast = () => null;
    mesh.visible = false;
    return;
  }

  mesh.material.transparent = true;
  mesh.material.opacity = 0;
  mesh.material.depthWrite = false;
  mesh.material.needsUpdate = true;
  mesh.userData.__hiddenByHideObjects = true;
  mesh.raycast = () => null;
  mesh.visible = false;
};

const getClickedMesh = ({
  clientX,
  clientY,
  renderer,
  camera,
  model,
  raycaster,
  pointerNdc,
}) => {
  if (!model) {
    return null;
  }

  const rect = renderer.domElement.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return null;
  }

  pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointerNdc, camera);
  const intersections = raycaster.intersectObject(model, true);
  if (!intersections.length) {
    return null;
  }

  const hitObject = intersections[0].object;
  return hitObject?.isMesh ? hitObject : null;
};

const logDetectionInfo = (mesh) => {
  if (!mesh) {
    return;
  }

  console.log(mesh.name || "");
};

const hideInitialByNames = ({ model, objectNames = [] }) => {
  if (!model || !Array.isArray(objectNames) || !objectNames.length) {
    return 0;
  }

  const namesSet = new Set(objectNames.filter(Boolean));
  if (!namesSet.size) {
    return 0;
  }

  let hiddenCount = 0;
  model.traverse((node) => {
    if (!node?.isMesh) {
      return;
    }

    if (!namesSet.has(node.name)) {
      return;
    }

    applyInvisibleMaterial(node);
    hiddenCount += 1;
  });

  return hiddenCount;
};

const handleClick = ({
  clientX,
  clientY,
  renderer,
  camera,
  model,
  raycaster,
  pointerNdc,
  hideOnClickEnabled,
  detectObjectNamesEnabled,
}) => {
  const mesh = getClickedMesh({
    clientX,
    clientY,
    renderer,
    camera,
    model,
    raycaster,
    pointerNdc,
  });

  if (!mesh) {
    return false;
  }

  if (detectObjectNamesEnabled) {
    logDetectionInfo(mesh);
  }

  if (hideOnClickEnabled) {
    applyInvisibleMaterial(mesh);
  }

  return true;
};

export const HideObjects = {
  hideInitialByNames,
  handleClick,
};
