import React from "react";
import ARTrackingIframe from "./components/ARTrackingIframe";

const ART_example = () => {
  return (
    <ARTrackingIframe
      modelUrl="/models/arm_chair__furniture.glb"
      modelRotation="0 0 0"
      modelScale="3 3 3"
    />
  );
};

export default ART_example;
