import { useEffect, useState } from "react";

const RenderingModal = ({ open, item, onClose }) => {
  const [topOffset, setTopOffset] = useState(0);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    const header = document.querySelector("header");

    const updateTopOffset = () => {
      const headerHeight = header?.getBoundingClientRect?.().height ?? 0;
      setTopOffset(Math.max(0, Math.round(headerHeight)));
    };

    updateTopOffset();
    window.addEventListener("resize", updateTopOffset);

    let resizeObserver;
    if (header && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updateTopOffset);
      resizeObserver.observe(header);
    }

    return () => {
      window.removeEventListener("resize", updateTopOffset);
      resizeObserver?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverscroll = document.body.style.overscrollBehavior;
    const previousHtmlOverscroll =
      document.documentElement.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    document.documentElement.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overscrollBehavior = previousBodyOverscroll;
      document.documentElement.style.overscrollBehavior =
        previousHtmlOverscroll;
    };
  }, [open]);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 flex items-center justify-center px-4 py-4 sm:px-8 sm:py-6 lg:px-12 lg:py-8 transition-opacity duration-200 ${
        open
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0"
      }`}
      style={{ top: `${topOffset}px` }}
      onClick={onClose}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-black/60" />

      <article
        className="relative z-10 mx-auto w-full max-w-5xl"
        style={{ maxHeight: `calc(100dvh - ${topOffset + 24}px)` }}
        onClick={(event) => event.stopPropagation()}
      >
        {item ? (
          <div className="flex w-full max-w-full flex-col overflow-hidden bg-white">
            <div className="flex items-center justify-center">
              <div
                className="relative flex w-full items-center justify-center overflow-hidden bg-white"
                style={{
                  maxHeight: `calc(100dvh - ${topOffset + 220}px)`,
                  userSelect: "none",
                }}
              >
                <img
                  src={item.url}
                  alt={item.title}
                  className="block h-auto w-full max-w-full select-none object-contain"
                  draggable={false}
                  style={{
                    maxHeight: `calc(100dvh - ${topOffset + 220}px)`,
                    userSelect: "none",
                  }}
                  loading="eager"
                />
              </div>
            </div>
            <div className="w-full border-t border-slate-200 bg-white px-4 py-4 sm:px-5 sm:py-5">
              <h3 className="text-base font-semibold tracking-tight text-slate-800 sm:text-lg">
                {item.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 sm:text-base">
                {item.description}
              </p>
            </div>
          </div>
        ) : null}
      </article>
    </div>
  );
};

export default RenderingModal;
