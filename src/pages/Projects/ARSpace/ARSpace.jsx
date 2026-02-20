import React from "react";
import "@google/model-viewer";

const ARSpace = () => {
  return (
    <div className="flex min-h-full w-full flex-1 flex-col bg-gray-100">
      <model-viewer
        src="/projects/Noiseless/noiseless.glb"
        // src="/projects/Noiseless/art_deco_table_fan__dominion_5759.glb"
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "transparent",
        }}
      />
    </div>
  );
};

export default ARSpace;
