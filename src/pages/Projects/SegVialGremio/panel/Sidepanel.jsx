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
        description: "Play / Stop",
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
        description: "MovementMode: Walk",
      },
      {
        label: "Fly",
        field: "MovementMode",
        value: "Fly",
        description: "MovementMode: Fly",
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
        description: "GoTo: Reception1",
      },
      {
        label: "Reception 2",
        field: "GoTo",
        value: "Reception2",
        description: "GoTo: Reception2",
      },
      {
        label: "Sales",
        field: "GoTo",
        value: "Sales",
        description: "GoTo: Sales",
      },
      {
        label: "Furniture",
        field: "GoTo",
        value: "Furniture",
        description: "GoTo: Furniture",
      },
      {
        label: "Desk (Area)",
        field: "GoTo",
        value: "Desk",
        description: "GoTo: Desk",
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
        description: "ReceptionDesign: 1",
      },
      {
        label: "Design 2",
        field: "ReceptionDesign",
        value: 2,
        description: "ReceptionDesign: 2",
      },
      {
        label: "Design 3",
        field: "ReceptionDesign",
        value: 3,
        description: "ReceptionDesign: 3",
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
        description: "DeskVariant: 1",
      },
      {
        label: "Desk 2",
        field: "DeskVariant",
        value: 2,
        description: "DeskVariant: 2",
      },
      {
        label: "Desk 3",
        field: "DeskVariant",
        value: 3,
        description: "DeskVariant: 3",
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
        description: "Textile: 1",
      },
      {
        label: "Textile 2",
        field: "Textile",
        value: 2,
        description: "Textile: 2",
      },
      {
        label: "Textile 3",
        field: "Textile",
        value: 3,
        description: "Textile: 3",
      },
    ],
  },
];

function emitAction(action) {
  sendCustomCommand({ [action.field]: action.value });
}

export default function Sidepanel() {
  const allSectionTitles = useMemo(() => SECTIONS.map((s) => s.title), []);
  const [openSections, setOpenSections] = useState(
    () => new Set(allSectionTitles),
  );

  function toggleSection(title) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#f4f5f6] text-[#111] max-[600px]:text-[0.78rem]">
      <div className="flex items-baseline justify-between gap-2 border-b border-slate-300 bg-white px-4 py-3 text-[0.95rem] max-[900px]:px-3 max-[900px]:py-2">
        <strong className="text-sm font-bold">Controls</strong>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white" id="sp-body">
        {SECTIONS.map((section) => {
          const isOpen = openSections.has(section.title);
          const sectionId = section.title;
          const sectionBodyId = `sp-section-body-${sectionId}`;

          return (
            <div key={section.title} className="flex flex-col">
              <button
                type="button"
                className="flex min-h-10 w-full items-center justify-between gap-2 border-b border-slate-200 bg-black/5 px-3 py-1 text-left hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                aria-expanded={isOpen}
                aria-controls={sectionBodyId}
                onClick={() => toggleSection(section.title)}
              >
                <h2 className="m-0 p-0 text-[0.95rem] font-semibold text-[#111]">
                  {section.title}
                </h2>
                <span
                  className="inline-flex h-6 w-6 flex-none items-center justify-center rounded-sm text-slate-700"
                  aria-hidden
                >
                  {isOpen ? "▾" : "▸"}
                </span>
              </button>

              <div
                className="flex flex-col bg-white p-3"
                id={sectionBodyId}
                hidden={!isOpen}
              >
                <div className="grid grid-cols-1 gap-2">
                  {section.actions.map((action) => (
                    <button
                      key={`${section.title}:${action.label}`}
                      type="button"
                      className="w-full rounded-[10px] border border-slate-200 bg-white p-2.5 text-left transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      onClick={() => emitAction(action)}
                      title={
                        action.description ??
                        `${action.field}: ${String(action.value)}`
                      }
                    >
                      <span className="block text-[0.85rem] font-bold leading-tight">
                        {action.label}
                      </span>
                      <span className="mt-1 block break-words text-[0.7rem] text-slate-600">
                        {action.description ??
                          `${action.field}: ${String(action.value)}`}
                      </span>
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
