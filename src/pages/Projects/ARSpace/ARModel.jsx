import React from "react";
import "@google/model-viewer";

const LAMP_GLB_URL =
  "/projects/Noiseless/art_deco_table_fan__dominion_5759.glb";

const ARModel = () => {
  return (
    <div className="flex min-h-full w-full flex-1 flex-col bg-gray-100">
      <model-viewer
        src={LAMP_GLB_URL}
        ar
        ar-modes="webxr quick-look scene-viewer"
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

export default ARModel;
