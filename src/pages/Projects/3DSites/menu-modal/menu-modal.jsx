import { useEffect } from "react";

const MenuModal = ({
  visible = true,
  title = "Menu",
  moveLabel = "Move: WASD",
  lookLabel = "Look: MOUSE",
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
    <div className="absolute inset-0 z-10 flex h-full w-full items-center justify-center backdrop-blur-sm">
      <div className="min-w-64 border border-white rounded-md p-4 text-center text-white">
        <div className="flex items-center justify-between gap-4">
          <p className="text-2xl font-medium">{title}</p>
          <button
            type="button"
            className="text-xl leading-none"
            onClick={onClose}
            aria-label="Close menu"
          >
            X
          </button>
        </div>
        <p className="mt-3 text-lg leading-7">
          {moveLabel}
          <br />
          {lookLabel}
        </p>
      </div>
    </div>
  );
};

export default MenuModal;
