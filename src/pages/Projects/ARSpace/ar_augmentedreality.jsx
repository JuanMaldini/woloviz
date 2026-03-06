import React, { useMemo, useState } from "react";
import ARModelSlots from "./components/ARModelSlots";
import ARViewerWithLoader from "./components/ARViewerWithLoader";

const ArAugmentedReality = () => {
  const models = useMemo(
    () => [
      { label: "Chair", modelSrc: "/models/arm_chair__furniture.glb" },
      { label: "Pantry", modelSrc: "/models/inza00.glb" },
    ],
    [],
  );

  const [selectedModel, setSelectedModel] = useState(models[0]);

  return (
    <div className="relative flex min-h-full w-full flex-1">
      <ARViewerWithLoader modelSrc={selectedModel.modelSrc} />
      <ARModelSlots
        items={models}
        selectedModelSrc={selectedModel.modelSrc}
        onSelect={setSelectedModel}
      />
    </div>
  );
};

export default ArAugmentedReality;
