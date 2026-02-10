import "./Sidepanel.css";

import { useMemo, useState } from "react";

import { sendCustomCommand } from "../../E3DS/utils/e3ds-messaging";

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
    <div className="sp-panel">
      <div className="sp-header">
        <strong className="sp-title">Controls</strong>
      </div>

      <div className="sp-body" id="sp-body">
        {SECTIONS.map((section) => {
          const isOpen = openSections.has(section.title);
          const sectionId = section.title;
          const sectionBodyId = `sp-section-body-${sectionId}`;

          return (
            <div key={section.title} className="sp-section-wrapper">
              <button
                type="button"
                className="sp-section-header sp-section-header-btn"
                aria-expanded={isOpen}
                aria-controls={sectionBodyId}
                onClick={() => toggleSection(section.title)}
              >
                <h2 className="sp-section-title">{section.title}</h2>
                <span className="sp-section-chevron" aria-hidden>
                  {isOpen ? "▾" : "▸"}
                </span>
              </button>

              <div
                className="sp-section-body"
                id={sectionBodyId}
                hidden={!isOpen}
              >
                <div className="sp-actions">
                  {section.actions.map((action) => (
                    <button
                      key={`${section.title}:${action.label}`}
                      type="button"
                      className="sp-action-btn"
                      onClick={() => emitAction(action)}
                      title={
                        action.description ??
                        `${action.field}: ${String(action.value)}`
                      }
                    >
                      <span className="sp-action-label">{action.label}</span>
                      <span className="sp-action-meta">
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
