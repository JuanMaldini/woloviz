import { OverwriteMaterialToggle } from "./OverwriteMaterial";
import Screenshot from "./Screenshot";
import CopyCurrentViewButton from "./CopyCurrentViewButton";

const CurrentViewPositionPanel = ({
  showCopyButton = true,
  copyMode,
  cameraRef,
  orbitControlsRef,
  pointerLockControlsRef,
  activeSlideTitle,
  currentPlayerSlide,
  overwriteEnabled = false,
  onRequestScreenshot,
  onToggleOverwrite,
}) => {
  const isOverwriteDisabled = typeof onToggleOverwrite !== "function";
  const isScreenshotDisabled = typeof onRequestScreenshot !== "function";
  const isCopyDisabled =
    (!cameraRef?.current && !currentPlayerSlide) ||
    (copyMode !== "orbit" && copyMode !== "pointer-lock");

  return (
    <div className="inline-flex items-center gap-2">
      {showCopyButton ? (
        <CopyCurrentViewButton
          activeSlideTitle={activeSlideTitle}
          copyMode={copyMode}
          cameraRef={cameraRef}
          orbitControlsRef={orbitControlsRef}
          pointerLockControlsRef={pointerLockControlsRef}
          currentPlayerSlide={currentPlayerSlide}
          disabled={isCopyDisabled}
        />
      ) : null}

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
