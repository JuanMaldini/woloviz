import { useEffect } from "react";

const MenuModal = ({
  visible = true,
  title = "Click to Play",
  moveLabel = "Move: WASD",
  lookLabel = "",
  showTitle = true,
  showMoveLabel = true,
  showLookLabel = false,
  showCloseButton = true,
  closeLabel = "X",
  onClose,
}) => {
  useEffect(() => {
    if (!visible || !onClose) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose(event);
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [visible, onClose]);

  if (!visible) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-10 flex h-full w-full items-center justify-center backdrop-blur-[1px]">
      <div className="min-w-64 rounded-[24px] border border-white p-4 text-white">
        <div className="flex items-center justify-between gap-4">
          {showTitle && title ? <p className="text-2xl font-medium">{title}</p> : <span />}
          {showCloseButton ? (
            <button
              type="button"
              className="text-xl leading-none"
              onClick={onClose}
              aria-label="Close menu"
            >
              {closeLabel}
            </button>
          ) : null}
        </div>
        {(showMoveLabel && moveLabel) || (showLookLabel && lookLabel) ? (
          <p className="mt-3 text-lg leading-7">
            {showMoveLabel && moveLabel ? moveLabel : null}
            {showMoveLabel && moveLabel && showLookLabel && lookLabel ? (
              <br />
            ) : null}
            {showLookLabel && lookLabel ? lookLabel : null}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default MenuModal;
