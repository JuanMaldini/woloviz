import React, { useEffect, useRef } from "react";
import "@google/model-viewer";

const ARModelSlots = ({ items = [], selectedModelSrc, onSelect }) => {
  const sliderRef = useRef(null);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) {
      return undefined;
    }

    const handleBeforeXrSelect = (event) => {
      event.preventDefault();
    };

    slider.addEventListener("beforexrselect", handleBeforeXrSelect);

    return () => {
      slider.removeEventListener("beforexrselect", handleBeforeXrSelect);
    };
  }, []);

  if (!items.length) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute bottom-4 left-3 right-24 z-20">
      <div
        ref={sliderRef}
        className="pointer-events-auto mx-auto w-full max-w-4xl overflow-x-auto"
      >
        <div className="flex gap-2 pr-2">
          {items.map((item) => {
            const isSelected = item.modelSrc === selectedModelSrc;

            return (
              <button
                key={item.modelSrc}
                type="button"
                onClick={() => onSelect(item)}
                className={`flex h-28 w-28 shrink-0 flex-col overflow-hidden rounded-lg border transition-colors ${
                  isSelected
                    ? "border-slate-500 bg-slate-100"
                    : "border-slate-200 bg-white"
                }`}
                aria-pressed={isSelected}
                aria-label={item.label}
                title={item.label}
              >
                <div className="h-20 w-full bg-slate-50">
                  <model-viewer
                    src={item.modelSrc}
                    camera-controls
                    disable-pan
                    disable-zoom
                    auto-rotate
                    reveal="auto"
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: "transparent",
                    }}
                  />
                </div>
                <span className="truncate px-1 py-1 text-center text-xs text-slate-700">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ARModelSlots;
