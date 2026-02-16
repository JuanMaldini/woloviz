import { useMemo, useState } from "react";
import { OverwriteMaterialToggle } from "./OverwriteMaterial";

const toFixedNumber = (value, decimals = 3) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Number(numeric.toFixed(decimals));
};

const CurrentViewPositionPanel = ({
  currentPose,
  showOverwriteToggle = false,
  overwriteEnabled = false,
  onToggleOverwrite,
}) => {
  const [copied, setCopied] = useState(false);

  const currentPositions = useMemo(() => {
    if (!currentPose) {
      return [];
    }

    return [
      {
        position: {
          x: toFixedNumber(currentPose.position?.x),
          y: toFixedNumber(currentPose.position?.y),
          z: toFixedNumber(currentPose.position?.z),
        },
        lookDirection: {
          x: toFixedNumber(currentPose.lookDirection?.x),
          y: toFixedNumber(currentPose.lookDirection?.y),
          z: toFixedNumber(currentPose.lookDirection?.z),
        },
      },
    ];
  }, [currentPose]);

  const handleCopy = async () => {
    if (!currentPositions.length) {
      return;
    }

    const payload = JSON.stringify(currentPositions, null, 2);

    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const isDisabled = !currentPositions.length;

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        disabled={isDisabled}
        aria-label={
          copied ? "Copied current position" : "Copy current position"
        }
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

      {showOverwriteToggle ? (
        <OverwriteMaterialToggle
          enabled={overwriteEnabled}
          onToggle={onToggleOverwrite}
        />
      ) : null}
    </div>
  );
};

export default CurrentViewPositionPanel;
