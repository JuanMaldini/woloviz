import { useEffect, useRef, useState } from "react";

const RenderingModal = ({ open, item, onClose }) => {
  const [topOffset, setTopOffset] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const modalRef = useRef(null);
  const viewportRef = useRef(null);
  const imageRef = useRef(null);
  const lastTapRef = useRef({ time: 0, x: 0, y: 0, pointerType: "" });
  const pointerStateRef = useRef({
    active: false,
    id: null,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    moved: false,
  });

  const canZoom = Boolean(item?.bCanZoom);

  const clampPanOffset = (offset, scale) => {
    if (scale <= 1) {
      return { x: 0, y: 0 };
    }

    const viewportElement = viewportRef.current;
    const imageElement = imageRef.current;

    if (!viewportElement || !imageElement) {
      return { x: offset.x, y: offset.y };
    }

    const viewportWidth = viewportElement.clientWidth;
    const viewportHeight = viewportElement.clientHeight;
    const baseImageWidth = imageElement.offsetWidth;
    const baseImageHeight = imageElement.offsetHeight;

    const maxOffsetX = Math.max(
      0,
      (baseImageWidth * scale - viewportWidth) / 2,
    );
    const maxOffsetY = Math.max(
      0,
      (baseImageHeight * scale - viewportHeight) / 2,
    );

    return {
      x: Math.max(-maxOffsetX, Math.min(maxOffsetX, offset.x)),
      y: Math.max(-maxOffsetY, Math.min(maxOffsetY, offset.y)),
    };
  };

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
      setZoomScale(1);
      setPanOffset({ x: 0, y: 0 });
      setIsDragging(false);
      lastTapRef.current = { time: 0, x: 0, y: 0, pointerType: "" };
      pointerStateRef.current = {
        active: false,
        id: null,
        startX: 0,
        startY: 0,
        startPanX: 0,
        startPanY: 0,
        moved: false,
      };
      return;
    }

    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
    setIsDragging(false);
    lastTapRef.current = { time: 0, x: 0, y: 0, pointerType: "" };
    pointerStateRef.current = {
      active: false,
      id: null,
      startX: 0,
      startY: 0,
      startPanX: 0,
      startPanY: 0,
      moved: false,
    };
  }, [open, item]);

  useEffect(() => {
    setPanOffset((prev) => clampPanOffset(prev, zoomScale));
  }, [zoomScale]);

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

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const modalElement = modalRef.current;
    if (!modalElement) {
      return undefined;
    }

    const preventBackgroundScroll = (event) => {
      event.preventDefault();
    };

    modalElement.addEventListener("wheel", preventBackgroundScroll, {
      passive: false,
    });
    modalElement.addEventListener("touchmove", preventBackgroundScroll, {
      passive: false,
    });

    return () => {
      modalElement.removeEventListener("wheel", preventBackgroundScroll);
      modalElement.removeEventListener("touchmove", preventBackgroundScroll);
    };
  }, [open]);

  const toggleZoomAtPoint = (clientX, clientY) => {
    if (!canZoom) {
      return;
    }

    if (zoomScale >= 2) {
      setZoomScale(1);
      setPanOffset({ x: 0, y: 0 });
      return;
    }

    const viewportElement = viewportRef.current;
    if (!viewportElement) {
      setZoomScale(2);
      return;
    }

    const viewportRect = viewportElement.getBoundingClientRect();
    const viewportCenterX = viewportRect.left + viewportRect.width / 2;
    const viewportCenterY = viewportRect.top + viewportRect.height / 2;
    const desiredOffset = {
      x: viewportCenterX - clientX,
      y: viewportCenterY - clientY,
    };

    setZoomScale(2);
    setPanOffset(clampPanOffset(desiredOffset, 2));
  };

  const handlePointerDown = (event) => {
    if (!canZoom) {
      return;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    pointerStateRef.current = {
      active: true,
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPanX: panOffset.x,
      startPanY: panOffset.y,
      moved: false,
    };

    if (zoomScale > 1) {
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
    }
  };

  const handlePointerMove = (event) => {
    const pointerState = pointerStateRef.current;
    if (!pointerState.active || pointerState.id !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - pointerState.startX;
    const deltaY = event.clientY - pointerState.startY;
    const panSpeed = 1.35;
    const movedEnough = Math.hypot(deltaX, deltaY) > 2;

    if (movedEnough) {
      pointerStateRef.current = { ...pointerState, moved: true };
    }

    if (zoomScale > 1) {
      setIsDragging(true);
      setPanOffset(
        clampPanOffset(
          {
            x: pointerState.startPanX + deltaX * panSpeed,
            y: pointerState.startPanY + deltaY * panSpeed,
          },
          zoomScale,
        ),
      );
      event.preventDefault();
    }
  };

  const handlePointerUp = (event) => {
    const pointerState = pointerStateRef.current;
    if (!pointerState.active || pointerState.id !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const wasDragged = pointerState.moved;
    pointerStateRef.current = {
      active: false,
      id: null,
      startX: 0,
      startY: 0,
      startPanX: 0,
      startPanY: 0,
      moved: false,
    };
    setIsDragging(false);

    if (!canZoom || wasDragged) {
      return;
    }

    const now = Date.now();
    const elapsed = now - lastTapRef.current.time;
    const dx = event.clientX - lastTapRef.current.x;
    const dy = event.clientY - lastTapRef.current.y;
    const distance = Math.hypot(dx, dy);
    const samePointerType =
      lastTapRef.current.pointerType === event.pointerType;

    if (elapsed <= 320 && distance <= 36 && samePointerType) {
      event.preventDefault();
      toggleZoomAtPoint(event.clientX, event.clientY);
      lastTapRef.current = { time: 0, x: 0, y: 0, pointerType: "" };
      return;
    }

    lastTapRef.current = {
      time: now,
      x: event.clientX,
      y: event.clientY,
      pointerType: event.pointerType,
    };
  };

  const handlePointerCancel = (event) => {
    const pointerState = pointerStateRef.current;
    if (!pointerState.active || pointerState.id !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    pointerStateRef.current = {
      active: false,
      id: null,
      startX: 0,
      startY: 0,
      startPanX: 0,
      startPanY: 0,
      moved: false,
    };
    setIsDragging(false);
  };

  return (
    <div
      ref={modalRef}
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
                ref={viewportRef}
                className="relative flex w-full items-center justify-center overflow-hidden bg-white"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                style={{
                  maxHeight: `calc(100dvh - ${topOffset + 220}px)`,
                  touchAction: canZoom ? "none" : "auto",
                  userSelect: "none",
                }}
              >
                <img
                  ref={imageRef}
                  src={item.url}
                  alt={item.title}
                  className="block h-auto w-full max-w-full select-none object-contain"
                  draggable={false}
                  onDragStart={(event) => event.preventDefault()}
                  style={{
                    maxHeight: `calc(100dvh - ${topOffset + 220}px)`,
                    transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${zoomScale})`,
                    transformOrigin: "center center",
                    transition: isDragging
                      ? "none"
                      : "transform 160ms cubic-bezier(0.22, 1, 0.36, 1)",
                    cursor: isDragging ? "grabbing" : "default",
                    userSelect: "none",
                    WebkitUserDrag: "none",
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
