import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home/Home";
import SegVialGremio from "../pages/Projects/Realtime/SegVialGremio";
import NotFound from "../pages/NotFound/NotFound";

import SampleAI from "../pages/Projects/Tours/sample-ai/sample-ai";
import Marzipano from "../pages/Projects/Tours/marzipano/Marzipano";

import About from "../pages/About/About";
import Projects from "../pages/Projects/Projects";
import Contact from "../pages/Contact/Contact";

import AccessGate from "../pages/segurity/AccessGate";
import ProtectedRoute from "./ProtectedRoute";

import Playground from "../pages/Projects/Tours/playground/playground";

import Controls_Orbit from "../pages/Projects/3DSites/controls_orbit";
import Controls_PointerLock from "../pages/Projects/3DSites/controls_pointerlock";

import AR_Chair_01 from "../pages/Projects/ARSpace/AR_Chair_01";
import AR_Pantry from "../pages/Projects/ARSpace/AR_Pantry";

import ART_example from "../pages/Projects/ARTraking/ART_example";

import Renderings from "../pages/Projects/Renderings/Renderings";

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
      <Route path="/samplesvg" element={<ProtectedRoute><SegVialGremio/></ProtectedRoute>}/>

      {/*TOUR*/}
      <Route path="/sample-ai" element={<SampleAI />} />
      <Route path="/example" element={<Marzipano />} />

      {/*3D WEBSITES*/}
      <Route path="/controls_orbit" element={<Controls_Orbit />} />
      <Route path="/controls_pointerlock" element={<Controls_PointerLock />} />

      {/*AR SPACE*/}
      <Route path="/ar_chair_01" element={<AR_Chair_01 />} />
      <Route path="/ar_pantry" element={<AR_Pantry />} />

      {/*AR TRACKING*/}
      <Route path="/art_example" element={<ART_example />} />

      {/*RENDERINGS*/}
      <Route path="/renderings" element={<Renderings />} />

      {/*NOT FOUND*/}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
