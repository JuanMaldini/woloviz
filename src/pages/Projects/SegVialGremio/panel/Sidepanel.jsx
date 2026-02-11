import { useMemo, useState } from "react";

import { sendCustomCommand } from "../E3DS/utils/e3ds-messaging";

const SECTIONS = [
  {
    title: "Media",
    actions: [
      {
        label: "Video",
        field: "Video",
        value: "Play",
      },
    ],
  },
  {
    title: "Movement Mode",
    actions: [
      {
        label: "Walk",
        field: "MovementMode",
        value: "Walk",
      },
      {
        label: "Fly",
        field: "MovementMode",
        value: "Fly",
      },
    ],
  },
  {
    title: "Camera Locations",
    actions: [
      {
        label: "Reception 1",
        field: "GoTo",
        value: "Reception1",
      },
      {
        label: "Reception 2",
        field: "GoTo",
        value: "Reception2",
      },
      {
        label: "Sales",
        field: "GoTo",
        value: "Sales",
      },
      {
        label: "Furniture",
        field: "GoTo",
        value: "Furniture",
      },
      {
        label: "Desk (Area)",
        field: "GoTo",
        value: "Desk",
      },
    ],
  },
  {
    title: "Reception Design",
    actions: [
      {
        label: "Design 1",
        field: "ReceptionDesign",
        value: 1,
      },
      {
        label: "Design 2",
        field: "ReceptionDesign",
        value: 2,
      },
      {
        label: "Design 3",
        field: "ReceptionDesign",
        value: 3,
      },
    ],
  },
  {
    title: "Desk Options",
    actions: [
      {
        label: "Desk 1",
        field: "DeskVariant",
        value: 1,
      },
      {
        label: "Desk 2",
        field: "DeskVariant",
        value: 2,
      },
      {
        label: "Desk 3",
        field: "DeskVariant",
        value: 3,
      },
    ],
  },
  {
    title: "Textiles",
    actions: [
      {
        label: "Textile 1",
        field: "Textile",
        value: 1,
      },
      {
        label: "Textile 2",
        field: "Textile",
        value: 2,
      },
      {
        label: "Textile 3",
        field: "Textile",
        value: 3,
      },
    ],
  },
];

function emitAction(action) {
  sendCustomCommand({ [action.field]: action.value });
}

export default function Sidepanel() {
  const allSectionTitles = useMemo(() => SECTIONS.map((s) => s.title), []);
  const [openSections, setOpenSections] = useState(() => new Set());

  function toggleSection(title) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#eef0f2] text-slate-900 max-[600px]:text-[0.78rem]">
      <div className="flex items-baseline justify-between gap-2 border-b border-black/10 bg-[#e7eaee] px-4 py-3 text-[0.95rem] max-[900px]:px-3 max-[900px]:py-2">
        <strong className="text-sm font-bold tracking-wide text-slate-700">
          Controls
        </strong>
      </div>

      <div
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
        id="sp-body"
      >
        {SECTIONS.map((section) => {
          const isOpen = openSections.has(section.title);
          const sectionId = section.title;
          const sectionBodyId = `sp-section-body-${sectionId}`;

          return (
            <div key={section.title} className="relative">
              <button
                type="button"
                className="inline-flex w-full items-center justify-between gap-x-1.5 rounded-md bg-white px-3 py-2 text-left text-[0.9rem] font-semibold text-slate-800 ring-1 ring-black/5 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#e7eaee]"
                aria-expanded={isOpen}
                aria-controls={sectionBodyId}
                onClick={() => toggleSection(section.title)}
              >
                {section.title}
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                  className={`-mr-1 size-5 text-slate-500 transition-transform ${
                    isOpen ? "rotate-180" : "rotate-0"
                  }`}
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                  />
                </svg>
              </button>

              <div
                className="mt-2 w-full origin-top-right rounded-md bg-white outline-1 -outline-offset-1 outline-black/10 transition duration-150 ease-out"
                id={sectionBodyId}
                hidden={!isOpen}
              >
                <div className="py-1">
                  {section.actions.map((action) => (
                    <button
                      key={`${section.title}:${action.label}`}
                      type="button"
                      className="block w-full px-4 py-2 text-left text-[0.85rem] font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                      onClick={() => emitAction(action)}
                      title={`${action.field}: ${String(action.value)}`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
