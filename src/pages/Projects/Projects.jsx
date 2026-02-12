import React from "react";
import { Link } from "react-router-dom";

const Projects = () => (
  <div className="flex min-h-full w-full flex-1 flex-col bg-[#f5f5f5] px-6 py-6">
    <div className="ml-8 flex flex-col gap-2">
      <Link
        to="/samplesvg"
        className="w-fit text-[15px] font-medium text-black no-underline transition-colors hover:text-slate-600"
      >
        Realtime Office
      </Link>
      <Link
        to="/sample-ai"
        className="w-fit text-[15px] font-medium text-black no-underline transition-colors hover:text-slate-600"
      >
        Apartment
      </Link>
      {/* <Link
        to="/example"
        className="w-fit text-[15px] font-medium text-black no-underline transition-colors hover:text-slate-600"
      >
        Example
      </Link> */}
    </div>
  </div>
);

export default Projects;
