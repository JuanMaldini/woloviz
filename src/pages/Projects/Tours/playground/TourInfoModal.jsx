import { useEffect } from "react";

const TourInfoModal = ({ open, onClose }) => {
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

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tourInfoModalTitle"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id="tourInfoModalTitle"
            className="text-lg font-semibold text-slate-900"
          >
            Build your tour
          </h2>
        </div>

        <p className="mt-3 text-sm text-slate-700">
          Once you complete your tour, lets talk it to publish it
        </p>

      </div>
    </div>
  );
};

export default TourInfoModal;
