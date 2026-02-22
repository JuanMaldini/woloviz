import { useEffect } from "react";

const RenderingModal = ({ open, item, onClose }) => {
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

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        open
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0"
      }`}
      onClick={onClose}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-black/70" />

      <article
        className="relative z-10 w-full max-w-3xl bg-white"
        onClick={(event) => event.stopPropagation()}
      >
        {item ? (
          <>
            <img
              src={item.url}
              alt={item.title}
              className="h-72 w-full object-cover sm:h-96"
              loading="eager"
            />
            <div className="p-4">
              <h3 className="text-sm font-semibold text-slate-800">
                {item.title}
              </h3>
              <p className="text-sm text-slate-600">{item.description}</p>
            </div>
          </>
        ) : null}
      </article>
    </div>
  );
};

export default RenderingModal;
