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
      className="absolute bottom-3 right-3 z-40 inline-flex h-8 w-8 items-center justify-center rounded border border-white/80 bg-white/90 text-slate-900 shadow-sm transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300 sm:h-10 sm:w-10"
    >
      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
    </button>
  );
};

const MenuModal = ({
  visible = true,
  onClose,
  carouselPositions = PREVIEW_SLIDES,
  showCopyButton = true,
  copyMode,
  cameraRef,
  orbitControlsRef,
  pointerLockControlsRef,
  currentPlayerSlide,
  overwriteEnabled = false,
  onRequestScreenshot,
  onActiveSlideChange,
  onToggleOverwrite,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisibleInternal, setIsVisibleInternal] = useState(true);
  const [isPanelMounted, setIsPanelMounted] = useState(Boolean(visible));
  const [isPanelOpen, setIsPanelOpen] = useState(Boolean(visible));
  const closeAnimationTimeoutRef = useRef(null);

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

  useEffect(() => {
    if (closeAnimationTimeoutRef.current) {
      window.clearTimeout(closeAnimationTimeoutRef.current);
      closeAnimationTimeoutRef.current = null;
    }

    if (isVisible) {
      setIsPanelMounted(true);
      requestAnimationFrame(() => {
        setIsPanelOpen(true);
      });
      return;
    }

    setIsPanelOpen(false);
    closeAnimationTimeoutRef.current = window.setTimeout(() => {
      setIsPanelMounted(false);
    }, 220);
  }, [isVisible]);

  useEffect(() => {
    return () => {
      if (closeAnimationTimeoutRef.current) {
        window.clearTimeout(closeAnimationTimeoutRef.current);
      }
    };
  }, []);

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

  if (!isPanelMounted) {
    return null;
  }

  return (
    <div
      className={`absolute inset-0 z-50 flex h-full w-full items-end justify-center  px-2 pb-2 pt-10 transition-opacity duration-200 sm:px-3 sm:pb-3 ${
        isPanelOpen ? "" : "pointer-events-none"
            }`}
      onClick={handleClose}
    >
      <div
        className={`inline-flex w-full max-w-md flex-col overflow-hidden rounded-xl bg-white text-black shadow-lg transition-all duration-200 ${
          isPanelOpen ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="grid w-full grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center bg-white/95 px-2 py-2 sm:grid-cols-[3rem_minmax(0,1fr)_3rem] sm:px-3">
          <button
            type="button"
            onClick={showPrevious}
            className="inline-flex h-9 w-[4.5rem] items-center justify-center rounded-md border border-black/15 bg-white text-2xl text-black/55 transition-colors hover:bg-black/[0.04] hover:text-black/75 disabled:pointer-events-none disabled:opacity-30 sm:h-10 sm:w-20"
            aria-label="Previous preview"
            disabled={slides.length <= 1}
          >
            ‹
          </button>

          <p className="px-2 text-center text-sm font-semibold leading-5 text-black/85 sm:text-base">
            <span className="block truncate">{activeSlide.title}</span>
          </p>

          <button
            type="button"
            onClick={showNext}
            className="inline-flex h-9 w-[4.5rem] items-center justify-center justify-self-end rounded-md border border-black/15 bg-white text-2xl text-black/55 transition-colors hover:bg-black/[0.04] hover:text-black/75 disabled:pointer-events-none disabled:opacity-30 sm:h-10 sm:w-20"
            aria-label="Next preview"
            disabled={slides.length <= 1}
          >
            ›
          </button>
        </div>

        <div className="w-full bg-white px-3 pb-3 pt-2 text-xs leading-5 text-black/85 sm:px-4 sm:pb-4 sm:text-sm sm:leading-6">
          <div className="flex items-start justify-between gap-3 sm:items-center">
            <p className="min-w-0 flex-1 break-words font-semibold tracking-wide">
              Unit A-1204 · 3 rooms
            </p>
            <CurrentViewPositionPanel
              showCopyButton={showCopyButton}
              copyMode={copyMode}
              cameraRef={cameraRef}
              orbitControlsRef={orbitControlsRef}
              pointerLockControlsRef={pointerLockControlsRef}
              activeSlideTitle={activeSlide?.title}
              currentPlayerSlide={currentPlayerSlide}
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
