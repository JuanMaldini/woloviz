import React from "react";
import ARTrackingIframe from "./components/ARTrackingIframe";

const AR_Tracking = () => {
  return (
    <ARTrackingIframe
      modelUrl="/models/arm_chair__furniture.glb"
      modelRotation="0 0 0"
      modelScale="3 3 3"
    />
  );
};

export default AR_Tracking;
