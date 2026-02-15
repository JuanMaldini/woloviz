import { useEffect, useMemo, useState } from "react";

const PREVIEW_SLIDES = [
  {
    title: "Fachada contemporánea",
    imageUrl: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1600&q=80",
  },
  {
    title: "Minimalist interior",
    imageUrl: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1300&q=80",
  },
  {
    title: "Project lobby",
    imageUrl: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1400&q=80",
  }
].map((slide) => ({ ...slide, id: `${slide.title}-${slide.imageUrl}`}));

const MenuModal = ({ visible = true, onClose }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisibleInternal, setIsVisibleInternal] = useState(true);

  const isControlled = typeof visible === "boolean";
  const isVisible = isControlled ? visible : isVisibleInternal;

  const activeSlide = useMemo(
    () => PREVIEW_SLIDES[activeIndex] ?? PREVIEW_SLIDES[0],
    [activeIndex],
  );

  const handleClose = (event) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    if (event?.stopPropagation) {
      event.stopPropagation();
    }

    if (onClose) {
      onClose(event);
      return;
    }

    setIsVisibleInternal(false);
  };

  const showPrevious = () => {
    setActiveIndex((current) =>
      current === 0 ? PREVIEW_SLIDES.length - 1 : current - 1,
    );
  };

  const showNext = () => {
    setActiveIndex((current) =>
      current === PREVIEW_SLIDES.length - 1 ? 0 : current + 1,
    );
  };

  useEffect(() => {
    if (!isVisible) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        handleClose(event);
      }

      if (event.key === "ArrowLeft") {
        showPrevious();
      }

      if (event.key === "ArrowRight") {
        showNext();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-50 flex h-full w-full items-center justify-center px-0 py-3">
      <div className="w-auto max-w-full text-black">
        <div className="inline-block bg-slate-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-black/10 px-4 py-2">
            <p className="text-sm font-medium tracking-wide">Floorplan</p>
            <button
              type="button"
              className="text-lg leading-none text-black/80 hover:text-black"
              onClick={handleClose}
              aria-label="Close menu"
            >
              X
            </button>
          </div>

          <div className="">
            <div className="flex items-center justify-center">
              <div className="inline-flex w-fit max-w-[100vw] flex-col items-center">
                <div className="relative inline-block max-w-full">
                  <img
                    src={activeSlide.imageUrl}
                    className="block max-h-[46vh] max-w-[100vw] h-auto w-auto"
                    loading="lazy"
                  />

                  <button
                    type="button"
                    onClick={showPrevious}
                    className="absolute inset-y-0 left-0 flex w-1/2 items-center justify-start bg-transparent px-4 text-3xl text-white/70 transition-colors hover:bg-black/10 hover:text-white"
                    aria-label="Previous preview"
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    onClick={showNext}
                    className="absolute inset-y-0 right-0 flex w-1/2 items-center justify-end bg-transparent px-4 text-3xl text-white/70 transition-colors hover:bg-black/10 hover:text-white"
                    aria-label="Next preview"
                  >
                    ›
                  </button>
                </div>

                <p className="mt-3 text-sm font-medium text-black/80">
                  {activeSlide.title}
                </p>
              </div>
            </div>

            <div className="mt-4 w-full border-t border-black/10 bg-white/70 px-4 py-3 text-sm leading-6 text-black/85">
              <p className="font-semibold tracking-wide">
                Unit A-1204 · 3 rooms
              </p>
              <p>68 m²· 2 rooms · 1 bathroom</p>
              <p>Living · Kitchen with bar</p>
              <p>Estimated delivery: Q4 2026 · Northeast orientation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuModal;
