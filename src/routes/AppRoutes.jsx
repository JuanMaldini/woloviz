import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home/Home";
import SegVialGremio from "../pages/Projects/Realtime/SegVialGremio";
import NotFound from "../pages/NotFound/NotFound";

import Apartment1 from "../pages/Projects/Tours/Apartment1/Apartment1";
import Apartment2 from "../pages/Projects/Tours/Apartment2/Apartment2";
import Apartment3 from "../pages/Projects/Tours/Apartment3/Apartment3";

import About from "../pages/About/About";
import Projects from "../pages/Projects/Projects";
import Contact from "../pages/contact/contact";

import AccessGate from "../pages/segurity/AccessGate";
import ProtectedRoute from "./ProtectedRoute";

import Playground from "../pages/Projects/Tours/playground/playground";

import Controls_Orbit from "../pages/Projects/3DSites/controls_orbit";
import Controls_PointerLock from "../pages/Projects/3DSites/controls_pointerlock";

import AR_Chair_01 from "../pages/Projects/ARSpace/AR_Chair_01";

import ART_example from "../pages/Projects/ARTraking/ART_example";

import Renderings from "../pages/Projects/Renderings/Renderings";

import InvoiceGenerator from "../pages/PDFGenerator/InvoiceGenerator";
import Prices from "../pages/Prices/Prices";

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
      <Route path="/apartment-1" element={<Apartment1 />} />
      <Route path="/apartment-2" element={<Apartment2 />} />
      <Route path="/apartment-3" element={<Apartment3 />} />

      {/*3D WEBSITES*/}
      <Route path="/controls_orbit" element={<Controls_Orbit />} />
      <Route path="/controls_pointerlock" element={<Controls_PointerLock />} />

      {/*AR SPACE*/}
      <Route path="/ar_chair_01" element={<AR_Chair_01 />} />

      {/*AR TRACKING*/}
      <Route path="/art_example" element={<ART_example />} />

      {/*RENDERINGS*/}
      <Route path="/renderings" element={<Renderings />} />

      {/*GENERATORS*/}
      <Route path="/generator-invoice" element={<InvoiceGenerator />} />

      {/*PRICES*/}
      <Route path="/prices" element={<Prices />} />

      {/*NOT FOUND*/}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
