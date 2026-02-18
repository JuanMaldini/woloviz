import { BsCamera } from "react-icons/bs";

const SCREENSHOT_FILE_PREFIX = "woloviz_screenshot";

const pad = (value) => String(value).padStart(2, "0");

const createTimestamp = (date = new Date()) => {
  return [
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`,
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`,
  ].join("_");
};

export const createScreenshotFileName = (prefix = SCREENSHOT_FILE_PREFIX) => {
  return `${prefix}_${createTimestamp()}.png`;
};

export const captureViewerScreenshot = ({
  renderer,
  scene,
  camera,
  filePrefix = SCREENSHOT_FILE_PREFIX,
}) => {
  if (!renderer || !scene || !camera) {
    return;
  }

  renderer.render(scene, camera);

  const sourceCanvas = renderer.domElement;
  if (!sourceCanvas.width || !sourceCanvas.height) {
    return;
  }

  const outputWidth = sourceCanvas.width;
  const outputHeight = sourceCanvas.height;
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = outputWidth;
  outputCanvas.height = outputHeight;
  const context = outputCanvas.getContext("2d");
  if (!context) {
    return;
  }

  context.clearRect(0, 0, outputWidth, outputHeight);

  context.drawImage(
    sourceCanvas,
    0,
    0,
    sourceCanvas.width,
    sourceCanvas.height,
    0,
    0,
    outputWidth,
    outputHeight,
  );

  outputCanvas.toBlob((blob) => {
    if (!blob) {
      return;
    }

    const fileName = createScreenshotFileName(filePrefix);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  }, "image/png");
};

export const createScreenshotRequestHandler = ({
  rendererRef,
  sceneRef,
  cameraRef,
  filePrefix = SCREENSHOT_FILE_PREFIX,
}) => {
  return () => {
    captureViewerScreenshot({
      renderer: rendererRef?.current,
      scene: sceneRef?.current,
      camera: cameraRef?.current,
      filePrefix,
    });
  };
};

const Screenshot = ({ onCapture, disabled = false }) => {
  const handleClick = () => {
    if (disabled || !onCapture) {
      return;
    }

    onCapture();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label="Take screenshot"
      title="Screenshot"
      className="inline-flex h-8 w-8 items-center justify-center rounded border border-black/15 bg-white text-black/55 transition-colors hover:bg-black/[0.04] hover:text-black/75 disabled:pointer-events-none disabled:opacity-30 sm:h-10 sm:w-10"
    >
      <BsCamera className="h-4 w-4 sm:h-5 sm:w-5" />
    </button>
  );
};

export default Screenshot;
