import React from "react";
import { TbPhotoSensor2 } from "react-icons/tb";

const ARTrackingIframe = ({
  modelUrl,
  modelRotation = "0 0 0",
  modelScale = "1 1 1",
  showFollowerPlane,
  title = "AR Tracking Example",
  trackerPdfUrl = "/projects/artracking/data/kanji.pdf",
}) => {
  const params = new URLSearchParams();
  const resolvedShowFollowerPlane =
    showFollowerPlane ?? (modelUrl ? false : true);

  if (modelUrl) {
    params.set("modelUrl", modelUrl);
  }

  if (modelRotation) {
    params.set("modelRotation", modelRotation);
  }

  if (modelScale) {
    params.set("modelScale", modelScale);
  }

  params.set("showFollowerPlane", resolvedShowFollowerPlane ? "1" : "0");

  const iframeSrc = params.toString()
    ? `/projects/artracking/ar-model-persist.html?${params.toString()}`
    : "/projects/artracking/ar-model-persist.html";

  return (
    <div className="relative flex min-h-full w-full flex-1 bg-black">
      <a
        href={trackerPdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Abrir marcador kanji"
        title="Abrir/descargar marcador"
        className="absolute right-3 top-3 z-40 inline-flex h-8 w-8 items-center justify-center rounded border border-white/80 bg-white/90 text-slate-900 shadow-sm transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300 sm:h-10 sm:w-10"
      >
        <TbPhotoSensor2 className="text-base sm:text-lg" />
      </a>

      <iframe
        title={title}
        src={iframeSrc}
        className="h-[calc(100vh-4rem)] w-full border-0"
        allow="camera; fullscreen"
      />
    </div>
  );
};

export default ARTrackingIframe;
