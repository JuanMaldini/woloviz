import * as THREE from "three";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IoIosInformationCircle,
  IoIosInformationCircleOutline,
} from "react-icons/io";
import CurrentViewPositionPanel from "./CurrentViewPositionPanel";

const toRoundedValue = (value) => Number(Number(value || 0).toFixed(3));

const toNormalizedPosition = (position) => ({
  x: toRoundedValue(position?.x),
  y: toRoundedValue(position?.y),
  z: toRoundedValue(position?.z),
});

const toNormalizedDirection = (direction) => {
  const vector = new THREE.Vector3(
    Number(direction?.x || 0),
    Number(direction?.y || 0),
    Number(direction?.z || -1),
  );

  if (vector.lengthSq() < 1e-6) {
    return { x: 0, y: 0, z: -1 };
  }

  vector.normalize();
  return {
    x: toRoundedValue(vector.x),
    y: toRoundedValue(vector.y),
    z: toRoundedValue(vector.z),
  };
};

const toNormalizedRotation = (rotation) => ({
  x: toRoundedValue(rotation?.x),
  y: toRoundedValue(rotation?.y),
  z: toRoundedValue(rotation?.z),
});

const toNormalizedDistance = (distance) => {
  const value = Number(distance);
  if (!Number.isFinite(value)) {
    return undefined;
  }

  return toRoundedValue(Math.max(0, value));
};

const toDirectionFromRotation = (rotation) => {
  const euler = new THREE.Euler(
    Number(rotation?.x || 0),
    Number(rotation?.y || 0),
    Number(rotation?.z || 0),
    "YXZ",
  );
  const direction = new THREE.Vector3(0, 0, -1).applyEuler(euler).normalize();

  return {
    x: toRoundedValue(direction.x),
    y: toRoundedValue(direction.y),
    z: toRoundedValue(direction.z),
  };
};

const toRotationFromDirection = (direction) => {
  const normalizedDirection = toNormalizedDirection(direction);
  const lookMatrix = new THREE.Matrix4().lookAt(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(
      normalizedDirection.x,
      normalizedDirection.y,
      normalizedDirection.z,
    ),
    new THREE.Vector3(0, 1, 0),
  );
  const euler = new THREE.Euler().setFromRotationMatrix(lookMatrix, "YXZ");

  return {
    x: toRoundedValue(euler.x),
    y: toRoundedValue(euler.y),
    z: toRoundedValue(euler.z),
  };
};

const normalizeCarouselSlide = (slide, index) => {
  const title =
    typeof slide?.title === "string" ? slide.title : `Slide ${index + 1}`;
  const position = toNormalizedPosition(slide?.position);
  const rotation = slide?.rotation
    ? toNormalizedRotation(slide.rotation)
    : toRotationFromDirection(slide?.direction);
  const direction = toDirectionFromRotation(rotation);
  const distance = toNormalizedDistance(slide?.distance);

  return {
    title,
    position,
    rotation,
    direction,
    distance,
    id:
      slide?.id ??
      JSON.stringify({
        title,
        position,
        rotation,
        distance,
      }),
  };
};

const normalizeCarouselSlides = (slides) =>
  slides.map((slide, index) => normalizeCarouselSlide(slide, index));

const PREVIEW_SLIDES = [
  {
    title: "Fachada contemporánea",
    position: { x: 40, y: 20, z: 65 },
    rotation: { x: -0.243, y: 0.565, z: 0 },
  },
  {
    title: "Minimalist interior",
    position: { x: 75, y: 16, z: 20 },
    rotation: { x: -0.181, y: 1.196, z: 0 },
  },
  {
    title: "Project lobby",
    position: { x: -20, y: 14, z: 70 },
    rotation: { x: -0.151, y: -0.277, z: 0 },
  },
];

export const useMenuPauseController = ({ initialVisible = true } = {}) => {
  const [isVisible, setIsVisible] = useState(initialVisible);
  const isVisibleRef = useRef(isVisible);

  useEffect(() => {
    isVisibleRef.current = isVisible;
  }, [isVisible]);

  const requestPause = useCallback(() => {
    setIsVisible(true);
  }, []);

  const requestResume = useCallback(() => {
    setIsVisible(false);
  }, []);

  const requestClose = useCallback((event) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    if (event?.stopPropagation) {
      event.stopPropagation();
    }
    setIsVisible(false);
  }, []);

  const requestToggle = useCallback((event) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    if (event?.stopPropagation) {
      event.stopPropagation();
    }

    setIsVisible((current) => !current);
  }, []);

  return {
    isVisible,
    isVisibleRef,
    requestPause,
    requestResume,
    requestClose,
    requestToggle,
    setIsVisible,
  };
};

export const FloatingMenuToggle = ({
  visible = true,
  isOpen = false,
  onToggle,
  ariaLabel,
}) => {
  if (!visible) {
    return null;
  }

  const Icon = isOpen ? IoIosInformationCircle : IoIosInformationCircleOutline;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={ariaLabel || (isOpen ? "Close menu" : "Open menu")}
      className="absolute right-3 top-3 z-40 inline-flex h-8 w-8 items-center justify-center rounded border border-white/80 bg-white/90 text-slate-900 shadow-sm transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300 sm:h-10 sm:w-10"
    >
      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
    </button>
  );
};

const MenuModal = ({
  visible = true,
  onClose,
  carouselPositions = PREVIEW_SLIDES,
  overwriteEnabled = false,
  onRequestScreenshot,
  onActiveSlideChange,
  onToggleOverwrite,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisibleInternal, setIsVisibleInternal] = useState(true);

  const isControlled = typeof visible === "boolean";
  const isVisible = isControlled ? visible : isVisibleInternal;
  const rawSlides =
    Array.isArray(carouselPositions) && carouselPositions.length
      ? carouselPositions
      : PREVIEW_SLIDES;
  const slides = useMemo(() => normalizeCarouselSlides(rawSlides), [rawSlides]);

  const activeSlide = useMemo(
    () => slides[activeIndex] ?? slides[0],
    [activeIndex, slides],
  );
  const onActiveSlideChangeRef = useRef(onActiveSlideChange);

  useEffect(() => {
    onActiveSlideChangeRef.current = onActiveSlideChange;
  }, [onActiveSlideChange]);

  useEffect(() => {
    if (!slides.length) {
      return;
    }

    setActiveIndex((current) => {
      if (current >= slides.length) {
        return slides.length - 1;
      }
      return current;
    });
  }, [slides]);

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
    if (!slides.length) {
      return;
    }

    setActiveIndex((current) =>
      current === 0 ? slides.length - 1 : current - 1,
    );
  };

  const showNext = () => {
    if (!slides.length) {
      return;
    }

    setActiveIndex((current) =>
      current === slides.length - 1 ? 0 : current + 1,
    );
  };

  const handleRequestScreenshot = () => {
    if (!onRequestScreenshot) {
      return;
    }

    onRequestScreenshot();
  };

  useEffect(() => {
    if (!activeSlide || typeof onActiveSlideChangeRef.current !== "function") {
      return;
    }

    onActiveSlideChangeRef.current({
      slide: activeSlide,
      index: activeIndex,
    });
  }, [activeIndex, activeSlide]);

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
    <div
      className="absolute inset-0 z-50 flex h-full w-full items-center justify-center bg-transparent px-0 py-3 backdrop-blur-none"
      onClick={handleClose}
    >
      <div
        className="inline-flex w-[92vw] max-w-[1200px] flex-col items-center text-black shadow-sm sm:w-[80vw] md:w-[70vw] lg:w-[60vw] xl:w-[52vw]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative aspect-video w-full">
          <div className="pointer-events-none absolute inset-0 border-x-2 border-t-2 border-white" />

          <button
            type="button"
            onClick={showPrevious}
            className="absolute inset-y-0 left-0 flex w-1/2 items-center justify-start bg-transparent px-4 text-3xl text-black/40 transition-colors hover:bg-black/10 hover:text-black/70"
            aria-label="Previous preview"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={showNext}
            className="absolute inset-y-0 right-0 flex w-1/2 items-center justify-end bg-transparent px-4 text-3xl text-black/40 transition-colors hover:bg-black/10 hover:text-black/70"
            aria-label="Next preview"
          >
            ›
          </button>
        </div>

        <div className="w-full bg-white px-3 py-2 text-center text-xs text-black/85 sm:px-4 sm:text-sm">
          <p className="break-words">{activeSlide.title}</p>
        </div>

        <div className="w-full border-t border-black/10 bg-white px-3 py-3 text-xs leading-5 text-black/85 sm:px-4 sm:text-sm sm:leading-6">
          <div className="flex items-start justify-between gap-2 sm:items-center">
            <p className="max-w-[60%] break-words font-semibold tracking-wide sm:max-w-none">
              Unit A-1204 · 3 rooms
            </p>
            <CurrentViewPositionPanel
              overwriteEnabled={overwriteEnabled}
              onRequestScreenshot={handleRequestScreenshot}
              onToggleOverwrite={onToggleOverwrite}
            />
          </div>
          <p>68 m²· 2 rooms · 1 bathroom</p>
          <p>Living · Kitchen with bar</p>
          <p>Estimated delivery: Q4 2026 · Northeast orientation</p>
        </div>
      </div>
    </div>
  );
};

export default MenuModal;
