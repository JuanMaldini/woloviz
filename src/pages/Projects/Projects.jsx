import React from "react";
import { Link } from "react-router-dom";

const Projects = () => (
  <div className="flex min-h-full w-full flex-1 flex-col bg-gray-100 px-6 py-8">
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-500">
          Virtual Tour
        </div>
        <div className="flex flex-col gap-1">
          <Link
            to="/sample-ai"
            className="w-fit text-base font-medium text-slate-900 no-underline transition-colors hover:text-slate-600"
          >
            Apartment
          </Link>

          <Link
            to="/example"
            className="w-fit text-base font-medium text-slate-900 no-underline transition-colors hover:text-slate-600"
          >
            Example
          </Link>

          <Link
            to="/playground"
            className="w-fit text-base font-medium text-slate-900 no-underline transition-colors hover:text-slate-600"
          >
            Tourfigurator
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-500">
          3D Space
        </div>
        <div className="flex flex-col gap-1">
          <Link
            to="/controls_orbit"
            className="w-fit text-base font-medium text-slate-900 no-underline transition-colors hover:text-slate-600"
          >
            Orbit
          </Link>

          <Link
            to="/controls_pointerlock"
            className="w-fit text-base font-medium text-slate-900 no-underline transition-colors hover:text-slate-600"
          >
            Walkable
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-500">
          AR Space
        </div>
        <div className="flex flex-col gap-1">
          <Link
            to="/ar_chair_01"
            className="w-fit text-base font-medium text-slate-900 no-underline transition-colors hover:text-slate-600"
          >
            Chair 01
          </Link>
          <Link
            to="/ar_chair_02"
            className="w-fit text-base font-medium text-slate-900 no-underline transition-colors hover:text-slate-600"
          >
            Chair 02
          </Link>
          <Link
            to="/ar_pantry"
            className="w-fit text-base font-medium text-slate-900 no-underline transition-colors hover:text-slate-600"
          >
            Pantry
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-500">
          AR Marker
        </div>
        <div className="flex flex-col gap-1">
          <Link
            to="/ar_marker_01"
            className="w-fit text-base font-medium text-slate-900 no-underline transition-colors hover:text-slate-600"
          >
            Marker 01
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-500">
          Realtime App
        </div>
        <div className="flex flex-col gap-1">
          <Link
            to="/samplesvg"
            className="w-fit text-base font-medium text-slate-900 no-underline transition-colors hover:text-slate-600"
          >
            Office Configurator
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default Projects;
