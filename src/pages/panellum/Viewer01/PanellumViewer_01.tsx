import React from "react";
import Pannellum from "../PannellumLibrary/elements/Pannellum";
import "./PanellumViewer_01.css";

class Example extends React.Component {
  render() {
    return (
      <div className="viewer-container">
        <Pannellum
          id="panorama-viewer"
          className="panorama-viewer"
          width="100%"
          height="100%"
          image="/projects/Sampleai/Sample_AI09_01.jpg"
        />
      </div>
    );
  }
}

export default Example;
