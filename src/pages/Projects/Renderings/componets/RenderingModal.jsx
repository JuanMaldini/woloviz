import { useEffect, useRef, useState } from "react";

const RenderingModal = ({ open, item, onClose }) => {
  const [topOffset, setTopOffset] = useState(0);
  const [imageWidth, setImageWidth] = useState(0);
  const imageRef = useRef(null);

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
    if (!open || !item) {
      setImageWidth(0);
      return undefined;
    }

    const imageElement = imageRef.current;
    if (!imageElement) {
      return undefined;
    }

    const updateImageWidth = () => {
      const nextWidth = imageElement.getBoundingClientRect().width;
      setImageWidth(Math.max(0, Math.round(nextWidth)));
    };

    updateImageWidth();

    let resizeObserver;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updateImageWidth);
      resizeObserver.observe(imageElement);
    }

    imageElement.addEventListener("load", updateImageWidth);
    window.addEventListener("resize", updateImageWidth);

    return () => {
      resizeObserver?.disconnect();
      imageElement.removeEventListener("load", updateImageWidth);
      window.removeEventListener("resize", updateImageWidth);
    };
  }, [open, item]);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 flex items-center justify-center px-5 py-5 sm:px-8 sm:py-6 lg:px-12 transition-opacity duration-200 ${
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
        className="relative z-10 max-w-full"
        style={{ maxHeight: `calc(100dvh - ${topOffset + 24}px)` }}
        onClick={(event) => event.stopPropagation()}
      >
        {item ? (
          <div
            className="inline-flex max-w-full flex-col bg-white"
            style={imageWidth > 0 ? { width: `${imageWidth}px` } : undefined}
          >
            <div className="flex items-center justify-center">
              <img
                ref={imageRef}
                src={item.url}
                alt={item.title}
                className="block h-auto w-auto max-w-full object-contain"
                style={{ maxHeight: `calc(100dvh - ${topOffset + 220}px)` }}
                loading="eager"
              />
            </div>
            <div className="w-full p-4">
              <h3 className="text-sm font-semibold text-slate-800">
                {item.title}
              </h3>
              <p className="text-sm text-slate-600">{item.description}</p>
            </div>
          </div>
        ) : null}
      </article>
    </div>
  );
};

export default RenderingModal;
