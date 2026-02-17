import { useState } from "react";
import { copyCurrentSlideToClipboard } from "./functions/copyCurrentView";

const CopyCurrentViewButton = ({
  currentPose,
  activeSlide,
  currentPlayerSlide,
  disabled = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (disabled) {
      return;
    }

    try {
      const success = await copyCurrentSlideToClipboard({
        currentPose,
        currentPlayerSlide,
        activeSlideTitle: activeSlide?.title,
      });

      if (!success) {
        setCopied(false);
        return;
      }

      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={disabled}
      aria-label={copied ? "Copied current position" : "Copy current position"}
      title={copied ? "Copied" : "Copy position"}
      className="inline-flex h-8 w-8 items-center justify-center rounded border border-black/35 bg-white text-black/85 shadow-sm transition-colors hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {copied ? (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
};

export default CopyCurrentViewButton;
