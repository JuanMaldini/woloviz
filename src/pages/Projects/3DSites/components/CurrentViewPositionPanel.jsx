import { IoIosInformationCircleOutline } from "react-icons/io";
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
  onToggleInfo,
}) => {
  const isOverwriteDisabled = typeof onToggleOverwrite !== "function";
  const isScreenshotDisabled = typeof onRequestScreenshot !== "function";
  const isInfoDisabled = typeof onToggleInfo !== "function";
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

      <button
        type="button"
        onClick={onToggleInfo}
        className="inline-flex h-8 w-8 items-center justify-center rounded border border-black/15 bg-white text-black/55 transition-colors hover:bg-black/[0.04] hover:text-black/75 disabled:pointer-events-none disabled:opacity-30 sm:h-10 sm:w-10"
        aria-label="Information"
        disabled={isInfoDisabled}
      >
        <IoIosInformationCircleOutline className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
    </div>
  );
};

export default CurrentViewPositionPanel;
