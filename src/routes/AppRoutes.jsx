import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home/Home";
import SegVialGremio from "../pages/Projects/Realtime/SegVialGremio/SegVialGremio";
import NotFound from "../pages/NotFound/NotFound";

import SampleAI from "../pages/Projects/Tours/sample-ai/sample-ai";
import Marzipano from "../pages/Projects/Tours/marzipano/Marzipano";

import About from "../pages/About/About";
import Projects from "../pages/Projects/Projects";
import Contact from "../pages/contact/contact";

import AccessGate from "../pages/segurity/AccessGate";
import ProtectedRoute from "./ProtectedRoute";

import Playground from "../pages/Projects/Tours/playground/playground";

import Controls_Orbit from "../pages/Projects/3DSites/controls_orbit";
import Controls_PointerLock from "../pages/Projects/3DSites/controls_pointerlock";

import ARModel from "../pages/Projects/ARSpace/ARModel";
import ARInterior from "../pages/Projects/ARSpace/ARInterior";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/about" element={<About />} />

      {/*SECURITY*/}
      <Route path="/security" element={<AccessGate />} />

      {/*PLAYGROUND*/}
      <Route path="/playground" element={<Playground />} />

      {/*INTERACTIVA APP*/}
      <Route path="/projects" element={<Projects />} />
      <Route
        path="/samplesvg"
        element={
          <ProtectedRoute>
            <SegVialGremio />
          </ProtectedRoute>
        }
      />

      {/*TOUR*/}
      <Route path="/sample-ai" element={<SampleAI />} />
      <Route path="/example" element={<Marzipano />} />

      {/*3D WEBSITES*/}
      <Route path="/controls_orbit" element={<Controls_Orbit />} />
      <Route path="/controls_pointerlock" element={<Controls_PointerLock />} />

      {/*AR SPACE*/}
      <Route path="/ar_model" element={<ARModel />} />
      <Route path="/ar_interior" element={<ARInterior />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
