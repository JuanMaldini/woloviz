import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home/Home";
import SegVialGremio from "../pages/InteractiveProjects/SegVialGremio/SegVialGremio";
import NotFound from "../pages/NotFound/NotFound";
import Contact from "../pages/contact/contact";
import PanellumViewer_01 from "../pages/panellum/Viewer01/PanellumViewer_01";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/samplesvg" element={<SegVialGremio />} />

      <Route path="/panellum-viewer-01" element={<PanellumViewer_01 />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
