import { OverwriteMaterialToggle } from "./OverwriteMaterial";
import Screenshot from "./Screenshot";

const CurrentViewPositionPanel = ({
  overwriteEnabled = false,
  onRequestScreenshot,
  onToggleOverwrite,
}) => {
  const isOverwriteDisabled = typeof onToggleOverwrite !== "function";
  const isScreenshotDisabled = typeof onRequestScreenshot !== "function";

  return (
    <div className="inline-flex items-center gap-2">
      <OverwriteMaterialToggle
        enabled={overwriteEnabled}
        onToggle={onToggleOverwrite}
        disabled={isOverwriteDisabled}
      />

      <Screenshot
        onCapture={onRequestScreenshot}
        disabled={isScreenshotDisabled}
      />
    </div>
  );
};

export default CurrentViewPositionPanel;
