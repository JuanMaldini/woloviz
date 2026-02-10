import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home/Home";
import SegVialGremio from "../pages/Projects/SegVialGremio/SegVialGremio";
import NotFound from "../pages/NotFound/NotFound";
import Contact from "../pages/contact/contact";
import SampleAI from "../pages/Projects/Tours/sample-ai/sample-ai";
import Marzipano from "../pages/Projects/Tours/marzipano/Marzipano";
import Projects from "../pages/Projects/Projects";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/contact" element={<Contact />} />

      {/*INTERACTIVA APP*/}
      <Route path="/projects" element={<Projects />} />

      <Route path="/samplesvg" element={<SegVialGremio />} />

      {/*TOUR*/}
      <Route path="/sample-ai" element={<SampleAI />} />
      <Route path="/example" element={<Marzipano />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
