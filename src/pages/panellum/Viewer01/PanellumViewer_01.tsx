import React from "react";
import ReactPannellum, { getConfig, loadScene, setHfov } from "../PannellumLibrary";
import "./PanellumViewer_01.css";

class Example extends React.Component {

  click() {
    console.log(getConfig());
  }

  render() {
    const config = {
      hfov: 100,
    };
    return (
      <div className="viewer-container">
        <ReactPannellum
          className="viewer-instance"
          id="1"
          sceneId="firstScene"
          imageSource="../../../../public/projects/Sampleai/Sample_AI09_01.jpg"
          config={config}
        />
      </div>
    );
  }
}

export default Example;
