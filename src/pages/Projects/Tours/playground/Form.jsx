import { useEffect, useMemo, useRef, useState } from "react";
import {
  getOrCreatePlaygroundSessionId,
  loadPlaygroundImageBlob,
  readPlaygroundDraftFromSession,
  savePlaygroundImageBlob,
  writePlaygroundDraftToSession,
} from "./browserDraftStorage";

const SETTINGS_DEFAULTS = {
  mouseViewMode: "drag",
  autorotateEnabled: false,
  fullscreenButton: true,
  viewControlButtons: true,
};

const PRESERVE_CURRENT_VIEW_STORAGE_KEY = "playground:preserve-current-view";
const RUNTIME_VIEW_STATE_STORAGE_KEY = "playground:current-view-state:v1";
const AUTOROTATE_ENABLED_STORAGE_KEY = "playground:autorotate-enabled";
const VIEW_CONTROL_BUTTONS_STORAGE_KEY = "playground:view-control-buttons";
const PLAYGROUND_DRAFT_SCHEMA_VERSION = 1;

const EQUIRECT_WIDTH_DEFAULT = 4000;
const SCENE_REQUIRED_ASPECT_RATIO = 2;
const SCENE_ASPECT_TOLERANCE = 0.08;
const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "exr"]);
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/x-exr",
  "image/exr",
]);
const FLOORPLAN_POSITION_DEFAULT = 0.5;

const createEmptyScene = () => ({
  name: "",
  imageUrl: "",
  initialViewParameters: {
    pitch: 0,
    yaw: 0,
    fov: 110,
  },
});

const createEmptyHotspots = () => ({
  linkHotspots: [],
  infoHotspots: [],
});

const createEmptyFloorplanPosition = () => ({
  x: FLOORPLAN_POSITION_DEFAULT,
  y: FLOORPLAN_POSITION_DEFAULT,
});

const createDefaultSceneId = (index) => `scene-${index + 1}`;

function buildSceneIds(rawSceneIds, scenesLength) {
  const nextIds = [];
  const used = new Set();

  for (let index = 0; index < scenesLength; index += 1) {
    const raw = String(rawSceneIds?.[index] ?? "").trim();
    let candidate = raw || createDefaultSceneId(index);

    if (!candidate || used.has(candidate)) {
      let counter = 1;
      let generated = `scene-${counter}`;
      while (used.has(generated)) {
        counter += 1;
        generated = `scene-${counter}`;
      }
      candidate = generated;
    }

    used.add(candidate);
    nextIds.push(candidate);
  }

  return nextIds;
}

const createEmptyLinkHotspot = () => ({
  yaw: "",
  pitch: "",
  target: "",
});

const createEmptyInfoHotspot = () => ({
  yaw: "",
  pitch: "",
  title: "",
  text: "",
});

function getDuplicateSceneNameError(scenes) {
  const seen = new Map();
  for (const scene of scenes) {
    const normalized = String(scene.name ?? "")
      .trim()
      .toLowerCase();
    if (!normalized) continue;
    seen.set(normalized, (seen.get(normalized) ?? 0) + 1);
  }
  const hasDuplicates = [...seen.values()].some((count) => count > 1);
  return hasDuplicates ? "Scene names must be unique (duplicates found)." : "";
}

function toNumberOr(value, fallback) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toRelativeFloorplanValue(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return FLOORPLAN_POSITION_DEFAULT;
  }
  if (n >= 0 && n <= 1) {
    return clampNumber(n, 0, 1);
  }
  return clampNumber(n / 100, 0, 1);
}

function toFixedNumber(value, decimals) {
  if (!Number.isFinite(value)) {
    return value;
  }
  return Number(value.toFixed(decimals));
}

function DraggableNumberInput({
  value,
  onChangeValue,
  min,
  max,
  dragStep = 1,
  wheelStep = 5,
  className,
  ariaLabel,
  placeholder,
  precision,
}) {
  const inputRef = useRef(null);
  const dragHandleRef = useRef(null);
  const dragRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    startValue: 0,
    lastAppliedValue: 0,
  });

  const getCurrentNumeric = () => {
    const n = Number(value);
    if (Number.isFinite(n)) {
      return n;
    }
    return Number.isFinite(Number(min)) ? Number(min) : 0;
  };

  const clampWithinBounds = (n) => {
    const minN = Number(min);
    const maxN = Number(max);
    if (Number.isFinite(minN) && Number.isFinite(maxN)) {
      return clampNumber(n, minN, maxN);
    }
    return n;
  };

  const applyNumericValue = (n) => {
    const clamped = clampWithinBounds(n);
    if (Number.isFinite(clamped) && Number.isInteger(precision)) {
      onChangeValue(toFixedNumber(clamped, precision));
      return;
    }
    onChangeValue(clamped);
  };

  const handleWheel = (event) => {
    event.preventDefault();
    const direction = event.deltaY < 0 ? 1 : -1;
    const current = getCurrentNumeric();
    applyNumericValue(current + direction * wheelStep);
  };

  const handlePointerDown = (event) => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    const current = getCurrentNumeric();
    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startValue: current,
      lastAppliedValue: current,
    };
    dragHandleRef.current?.setPointerCapture?.(event.pointerId);
    inputRef.current?.focus();
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag.active) {
      return;
    }

    const deltaX = event.clientX - drag.startX;
    const stepCount = Math.trunc(deltaX / 4);
    const next = clampWithinBounds(drag.startValue + stepCount * dragStep);

    if (next === drag.lastAppliedValue) {
      return;
    }

    drag.lastAppliedValue = next;
    onChangeValue(next);
  };

  const endDrag = () => {
    if (!dragRef.current.active) {
      return;
    }
    dragRef.current.active = false;
    dragRef.current.pointerId = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };

  const handlePointerUp = (event) => {
    const drag = dragRef.current;
    if (
      drag.active &&
      drag.pointerId !== null &&
      dragHandleRef.current?.hasPointerCapture?.(drag.pointerId)
    ) {
      dragHandleRef.current.releasePointerCapture(drag.pointerId);
    }
    endDrag();
  };

  const handlePointerCancel = () => {
    endDrag();
  };

  const handleBlur = () => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return;
    }
    applyNumericValue(numeric);
  };

  return (
    <div className="relative min-w-0 w-full">
      <input
        ref={inputRef}
        type="text"
        className={`${className} h-8 w-full min-w-0 pr-8 text-center tabular-nums`}
        value={value}
        onChange={(event) => onChangeValue(event.target.value)}
        onWheel={handleWheel}
        onBlur={handleBlur}
        aria-label={ariaLabel}
        placeholder={placeholder}
      />
      <span
        ref={dragHandleRef}
        className="absolute inset-y-0 right-0 flex w-7 items-center justify-center border-l border-black/10 text-[10px] text-slate-500 cursor-ew-resize select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        title="Drag horizontal ±1"
        aria-label="Drag to adjust value"
      >
        ↔
      </span>
    </div>
  );
}

function buildSceneSnippet(
  scene,
  {
    linkHotspots,
    infoHotspots,
    includeInitialViewParameters,
    originalImageFileName,
  },
) {
  const base = {
    id: scene.id,
    name: scene.name,
    imageUrl: scene.imageUrl,
    equirectWidth: EQUIRECT_WIDTH_DEFAULT,
    initialViewParameters: {
      pitch: toNumberOr(scene.initialViewParameters.pitch, 0),
      yaw: toNumberOr(scene.initialViewParameters.yaw, 0),
      fov: toNumberOr(scene.initialViewParameters.fov, 110),
    },
  };

  const lines = [];
  lines.push("{");
  lines.push(`  id: ${JSON.stringify(base.id)},`);
  lines.push(`  name: ${JSON.stringify(base.name)},`);
  const cleanOriginalFileName = String(originalImageFileName ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim();
  lines.push(
    cleanOriginalFileName
      ? `  imageUrl: ${JSON.stringify(base.imageUrl)}, // original file: ${cleanOriginalFileName}`
      : `  imageUrl: ${JSON.stringify(base.imageUrl)},`,
  );
  lines.push(`  equirectWidth: ${base.equirectWidth},`);
  if (includeInitialViewParameters) {
    lines.push("  initialViewParameters: {");
    lines.push(`    pitch: ${base.initialViewParameters.pitch},`);
    lines.push(`    yaw: ${base.initialViewParameters.yaw},`);
    lines.push(`    fov: ${base.initialViewParameters.fov},`);
    lines.push("  },");
  }

  lines.push("  linkHotspots: [");
  (linkHotspots ?? []).forEach((hotspot) => {
    if (!String(hotspot.target ?? "").trim()) {
      return;
    }
    lines.push(
      `    { yaw: ${toNumberOr(hotspot.yaw, 0)}, pitch: ${toNumberOr(hotspot.pitch, 0)}, target: ${JSON.stringify(String(hotspot.target).trim())} },`,
    );
  });
  lines.push("  ],");

  lines.push("  infoHotspots: [");
  (infoHotspots ?? []).forEach((hotspot) => {
    const title = String(hotspot.title ?? "title").trim() || "title";
    const text = String(hotspot.text ?? "").trim();
    const hasCoords = hotspot.yaw !== "" || hotspot.pitch !== "";
    if (!text && !hasCoords && !String(hotspot.title ?? "").trim()) {
      return;
    }
    lines.push(
      `    { yaw: ${toNumberOr(hotspot.yaw, 0)}, pitch: ${toNumberOr(hotspot.pitch, 0)}, title: ${JSON.stringify(title)}, text: ${JSON.stringify(text)} },`,
    );
  });
  lines.push("  ],");

  lines.push("}");
  return lines.join("\n");
}

function buildOutput({
  tourName,
  scenes,
  floorplanImageUrl,
  hotspotsBySceneIndex,
  floorplanPositions,
  settings,
  uploadedAssets,
}) {
  const runtimeUrlToFileName = new Map(
    (uploadedAssets ?? [])
      .filter((asset) => asset?.kind === "scene")
      .map((asset) => [
        String(asset.runtimeUrl ?? ""),
        String(asset.fileName ?? ""),
      ]),
  );

  const normalizedPositions = scenes
    .map((scene, index) => ({
      id: String(scene.id || "").trim(),
      x: clampNumber(
        toNumberOr(floorplanPositions?.[index]?.x, FLOORPLAN_POSITION_DEFAULT),
        0,
        1,
      ),
      y: clampNumber(
        toNumberOr(floorplanPositions?.[index]?.y, FLOORPLAN_POSITION_DEFAULT),
        0,
        1,
      ),
    }))
    .filter((position) => position.id.length > 0);

  const sceneSnippets = scenes.map((scene, index) =>
    buildSceneSnippet(scene, {
      ...(hotspotsBySceneIndex[index] ?? {
        linkHotspots: [],
        infoHotspots: [],
      }),
      includeInitialViewParameters: index === 0,
      originalImageFileName:
        runtimeUrlToFileName.get(String(scene.imageUrl ?? "")) || "",
    }),
  );

  const lines = [];

  lines.push("// Generated from /playground");
  lines.push("// Relative positions (0..1) over floorplan image.");
  lines.push("export const floorplanScenePositions = [");
  if (normalizedPositions.length) {
    normalizedPositions.forEach((p) => {
      lines.push(`  { id: ${JSON.stringify(p.id)}, x: ${p.x}, y: ${p.y} },`);
    });
  }
  lines.push("];");
  lines.push("");

  lines.push("export const data = {");
  lines.push("  scenes: [");
  sceneSnippets.forEach((snippet, index) => {
    const snippetLines = snippet.split("\n");
    if (index !== sceneSnippets.length - 1) {
      snippetLines[snippetLines.length - 1] =
        `${snippetLines[snippetLines.length - 1]},`;
    }
    lines.push(snippetLines.map((l) => `    ${l}`).join("\n"));
  });
  lines.push("  ],");

  lines.push(`  name: ${JSON.stringify(tourName)},`);
  lines.push(
    `  floorplanImageUrl: ${JSON.stringify(floorplanImageUrl.trim())},`,
  );
  lines.push("  settings: {");
  lines.push(`    mouseViewMode: ${JSON.stringify(settings.mouseViewMode)},`);
  lines.push(`    autorotateEnabled: ${Boolean(settings.autorotateEnabled)},`);
  lines.push(`    fullscreenButton: ${Boolean(settings.fullscreenButton)},`);
  lines.push(
    `    viewControlButtons: ${Boolean(settings.viewControlButtons)},`,
  );
  lines.push("  },");
  lines.push("};");

  return lines.join("\n");
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: "text/javascript;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

async function copyToClipboard(text) {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function sanitizePathSegment(value) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function getFileExtension(filename) {
  const value = String(filename ?? "");
  const dotIndex = value.lastIndexOf(".");
  if (dotIndex < 0) {
    return "";
  }
  return value.slice(dotIndex + 1).toLowerCase();
}

function isAllowedImageFile(file) {
  const extension = getFileExtension(file?.name);
  const mimeType = String(file?.type ?? "").toLowerCase();
  return (
    ALLOWED_IMAGE_EXTENSIONS.has(extension) ||
    ALLOWED_IMAGE_MIME_TYPES.has(mimeType)
  );
}

function readImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const blobUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const width = Number(image.naturalWidth) || 0;
      const height = Number(image.naturalHeight) || 0;
      URL.revokeObjectURL(blobUrl);
      resolve({ width, height });
    };

    image.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error("Could not read image dimensions"));
    };

    image.src = blobUrl;
  });
}

function buildClientAssetPath({ clientName, filename }) {
  const safeClient = sanitizePathSegment(clientName) || "cliente";
  const safeFilename = String(filename ?? "").trim() || "asset";
  return `/projects/clientes/${safeClient}/${safeFilename}`;
}

function revokeBlobUrl(url) {
  if (typeof url !== "string") {
    return;
  }
  if (!url.startsWith("blob:")) {
    return;
  }
  try {
    URL.revokeObjectURL(url);
  } catch {}
}

function buildDefaultSettings(initialData) {
  return {
    mouseViewMode: SETTINGS_DEFAULTS.mouseViewMode,
    autorotateEnabled: Boolean(
      initialData?.settings?.autorotateEnabled ??
      SETTINGS_DEFAULTS.autorotateEnabled,
    ),
    fullscreenButton: SETTINGS_DEFAULTS.fullscreenButton,
    viewControlButtons: Boolean(
      initialData?.settings?.viewControlButtons ??
      SETTINGS_DEFAULTS.viewControlButtons,
    ),
  };
}

export default function Form({
  initialData,
  initialFloorplanPositions,
  initialFloorplanImageUrl = "",
  onRuntimeDataChange,
}) {
  const isProduction = import.meta.env.PROD;
  const autoWriteTimerRef = useRef(null);
  const uploadedObjectUrlsRef = useRef(new Map());
  const sceneCardRefs = useRef(new Map());
  const floorplanFileInputRef = useRef(null);
  const sceneFileInputRefs = useRef({});
  const sessionIdRef = useRef("");
  const didHydrateDraftRef = useRef(false);
  const [tourName, setTourName] = useState(() => initialData?.name ?? "");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [uploadedAssets, setUploadedAssets] = useState([]);
  const [canPersistDraft, setCanPersistDraft] = useState(() => !isProduction);

  const [scenes, setScenes] = useState(() =>
    (initialData?.scenes ?? []).map((scene) => ({
      name: scene.name ?? "",
      imageUrl: scene.imageUrl ?? "",
      initialViewParameters: {
        pitch: scene.initialViewParameters?.pitch ?? 0,
        yaw: scene.initialViewParameters?.yaw ?? 0,
        fov: scene.initialViewParameters?.fov ?? 110,
      },
    })),
  );

  const [sceneIds, setSceneIds] = useState(() =>
    buildSceneIds(
      (initialData?.scenes ?? []).map((scene) => String(scene.id ?? "")),
      (initialData?.scenes ?? []).length,
    ),
  );

  const [floorplanPositions, setFloorplanPositions] = useState(() => {
    const initialScenes = initialData?.scenes ?? [];
    const initialPositions = initialFloorplanPositions ?? [];

    return initialScenes.map((scene, index) => {
      const byId = initialPositions.find(
        (position) => position.id === scene.id,
      );
      const byIndex = initialPositions[index];
      const source = byId ?? byIndex ?? createEmptyFloorplanPosition();
      return {
        x: toRelativeFloorplanValue(source.x),
        y: toRelativeFloorplanValue(source.y),
      };
    });
  });

  const [floorplanImageUrl, setFloorplanImageUrl] = useState(
    () => initialFloorplanImageUrl,
  );
  const [preserveCurrentView, setPreserveCurrentView] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    try {
      const saved = window.sessionStorage.getItem(
        PRESERVE_CURRENT_VIEW_STORAGE_KEY,
      );
      if (saved === "1" || saved === "0") {
        return saved === "1";
      }
      return true;
    } catch {
      return true;
    }
  });
  const [autorotateEnabled, setAutorotateEnabled] = useState(() => {
    if (typeof window === "undefined") {
      return Boolean(initialData?.settings?.autorotateEnabled);
    }
    try {
      const saved = window.sessionStorage.getItem(
        AUTOROTATE_ENABLED_STORAGE_KEY,
      );
      if (saved === "1" || saved === "0") {
        return saved === "1";
      }
    } catch {}
    return Boolean(
      initialData?.settings?.autorotateEnabled ??
      SETTINGS_DEFAULTS.autorotateEnabled,
    );
  });
  const [viewControlButtons, setViewControlButtons] = useState(() => {
    if (typeof window === "undefined") {
      return Boolean(initialData?.settings?.viewControlButtons ?? true);
    }
    try {
      const saved = window.sessionStorage.getItem(
        VIEW_CONTROL_BUTTONS_STORAGE_KEY,
      );
      if (saved === "1" || saved === "0") {
        return saved === "1";
      }
    } catch {}
    return Boolean(
      initialData?.settings?.viewControlButtons ??
      SETTINGS_DEFAULTS.viewControlButtons,
    );
  });

  const [hotspotsBySceneIndex, setHotspotsBySceneIndex] = useState(() =>
    (initialData?.scenes ?? []).map((scene) => ({
      linkHotspots: (scene.linkHotspots ?? []).map((hotspot) => ({
        yaw: hotspot.yaw ?? "",
        pitch: hotspot.pitch ?? "",
        target: hotspot.target ?? "",
      })),
      infoHotspots: (scene.infoHotspots ?? []).map((hotspot) => ({
        yaw: hotspot.yaw ?? "",
        pitch: hotspot.pitch ?? "",
        title: hotspot.title ?? "",
        text: hotspot.text ?? "",
      })),
    })),
  );

  const [expandedSceneIndexes, setExpandedSceneIndexes] = useState([0]);
  const [activeSceneId, setActiveSceneId] = useState(() =>
    String(initialData?.scenes?.[0]?.id ?? "").trim(),
  );

  const derivedScenes = useMemo(() => {
    return scenes.map((scene, index) => ({
      ...scene,
      id: sceneIds[index] ?? createDefaultSceneId(index),
    }));
  }, [scenes, sceneIds]);

  const sceneNameError = useMemo(
    () => getDuplicateSceneNameError(scenes),
    [scenes],
  );

  const [copyState, setCopyState] = useState({ state: "idle", message: "" });
  const [imageLoadingState, setImageLoadingState] = useState({
    active: false,
    message: "",
  });
  const [linkPickState, setLinkPickState] = useState({
    sceneIndex: null,
    hotspotIndex: null,
    message: "",
  });
  const [infoPickState, setInfoPickState] = useState({
    sceneIndex: null,
    hotspotIndex: null,
    message: "",
  });

  const output = useMemo(
    () =>
      buildOutput({
        tourName,
        scenes: derivedScenes,
        floorplanImageUrl,
        hotspotsBySceneIndex,
        floorplanPositions,
        uploadedAssets,
        settings: {
          mouseViewMode: SETTINGS_DEFAULTS.mouseViewMode,
          autorotateEnabled,
          fullscreenButton: SETTINGS_DEFAULTS.fullscreenButton,
          viewControlButtons,
        },
      }),
    [
      tourName,
      derivedScenes,
      floorplanImageUrl,
      hotspotsBySceneIndex,
      floorplanPositions,
      uploadedAssets,
      autorotateEnabled,
      viewControlButtons,
    ],
  );

  const runtimeViewerData = useMemo(
    () => ({
      name: tourName,
      floorplanImageUrl,
      settings: {
        mouseViewMode: SETTINGS_DEFAULTS.mouseViewMode,
        autorotateEnabled,
        fullscreenButton: SETTINGS_DEFAULTS.fullscreenButton,
        viewControlButtons,
      },
      scenes: derivedScenes.map((scene, index) => ({
        ...scene,
        linkHotspots: (hotspotsBySceneIndex[index]?.linkHotspots ?? []).map(
          (hotspot) => ({
            yaw: toNumberOr(hotspot.yaw, 0),
            pitch: toNumberOr(hotspot.pitch, 0),
            target: String(hotspot.target ?? "").trim(),
          }),
        ),
        infoHotspots: (hotspotsBySceneIndex[index]?.infoHotspots ?? []).map(
          (hotspot) => ({
            yaw: toNumberOr(hotspot.yaw, 0),
            pitch: toNumberOr(hotspot.pitch, 0),
            title: String(hotspot.title ?? "").trim() || "title",
            text: String(hotspot.text ?? "").trim(),
          }),
        ),
      })),
    }),
    [
      tourName,
      floorplanImageUrl,
      autorotateEnabled,
      viewControlButtons,
      derivedScenes,
      hotspotsBySceneIndex,
    ],
  );

  useEffect(() => {
    if (typeof onRuntimeDataChange !== "function") {
      return;
    }

    onRuntimeDataChange({
      data: runtimeViewerData,
      floorplanPositions,
    });
  }, [onRuntimeDataChange, runtimeViewerData, floorplanPositions]);

  useEffect(() => {
    const handleActiveSceneChanged = (event) => {
      const nextSceneId = String(event?.detail?.sceneId ?? "").trim();
      if (!nextSceneId) {
        return;
      }
      setActiveSceneId(nextSceneId);
    };

    window.addEventListener(
      "playground:active-scene-changed",
      handleActiveSceneChanged,
    );

    return () => {
      window.removeEventListener(
        "playground:active-scene-changed",
        handleActiveSceneChanged,
      );
    };
  }, []);

  useEffect(() => {
    if (!activeSceneId) {
      return;
    }

    const index = derivedScenes.findIndex(
      (scene) => scene.id === activeSceneId,
    );
    if (index < 0) {
      return;
    }

    const card = sceneCardRefs.current.get(index);
    if (!card) {
      return;
    }

    card.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [activeSceneId, derivedScenes]);

  const resolveSceneImageAssetKey = (sceneIndex, sceneImageUrl, assets) => {
    if (!String(sceneImageUrl ?? "").startsWith("blob:")) {
      return "";
    }

    const byKindAndIndex = (assets ?? []).find(
      (asset) =>
        asset?.kind === "scene" &&
        Number(asset?.sceneIndex) === sceneIndex &&
        String(asset?.runtimeUrl ?? "") === String(sceneImageUrl ?? ""),
    );
    return String(byKindAndIndex?.key ?? "");
  };

  const resolveFloorplanAssetKey = (floorplanUrl, assets) => {
    if (!String(floorplanUrl ?? "").startsWith("blob:")) {
      return "";
    }

    const floorplanAsset = (assets ?? []).find(
      (asset) =>
        asset?.kind === "floorplan" &&
        String(asset?.runtimeUrl ?? "") === String(floorplanUrl ?? ""),
    );
    return String(floorplanAsset?.key ?? "");
  };

  const buildBrowserDraftSnapshot = () => {
    const sceneImageAssetKeys = derivedScenes.map((scene, index) =>
      resolveSceneImageAssetKey(index, scene.imageUrl, uploadedAssets),
    );

    return {
      schemaVersion: PLAYGROUND_DRAFT_SCHEMA_VERSION,
      updatedAt: Date.now(),
      tourName,
      clientName,
      clientEmail,
      preserveCurrentView,
      autorotateEnabled,
      viewControlButtons,
      settings: buildDefaultSettings(initialData),
      sceneIds,
      scenes,
      hotspotsBySceneIndex,
      floorplanPositions,
      floorplanImageUrl,
      floorplanImageAssetKey: resolveFloorplanAssetKey(
        floorplanImageUrl,
        uploadedAssets,
      ),
      sceneImageAssetKeys,
      uploadedAssets: uploadedAssets.map((asset) => ({
        ...asset,
        runtimeUrl: "",
      })),
    };
  };

  const writeDraftInBrowser = (notifySuccess = false) => {
    const snapshot = buildBrowserDraftSnapshot();
    const ok = writePlaygroundDraftToSession(snapshot);
    if (!ok) {
      throw new Error("Failed to persist playground draft in session");
    }

    if (notifySuccess) {
      setCopyState({
        state: "copied",
        message: "Saved draft in current browser session",
      });
    }
  };

  useEffect(() => {
    if (!isProduction || typeof window === "undefined") {
      didHydrateDraftRef.current = true;
      setCanPersistDraft(true);
      return;
    }

    let cancelled = false;

    const hydrateFromSession = async () => {
      sessionIdRef.current = getOrCreatePlaygroundSessionId();
      const savedDraft = readPlaygroundDraftFromSession();

      if (
        !savedDraft ||
        Number(savedDraft?.schemaVersion) !== PLAYGROUND_DRAFT_SCHEMA_VERSION
      ) {
        if (!cancelled) {
          didHydrateDraftRef.current = true;
          setCanPersistDraft(true);
        }
        return;
      }

      const restoredAssets = await Promise.all(
        (savedDraft.uploadedAssets ?? []).map(async (asset) => {
          const blobId = String(asset?.persistedBlobId ?? "").trim();
          if (!blobId) {
            return {
              ...asset,
              runtimeUrl: "",
            };
          }

          const blob = await loadPlaygroundImageBlob(blobId);
          if (!blob) {
            return {
              ...asset,
              runtimeUrl: "",
            };
          }

          return {
            ...asset,
            runtimeUrl: URL.createObjectURL(blob),
          };
        }),
      );

      if (cancelled) {
        restoredAssets.forEach((asset) => revokeBlobUrl(asset?.runtimeUrl));
        return;
      }

      uploadedObjectUrlsRef.current.forEach((url) => revokeBlobUrl(url));
      uploadedObjectUrlsRef.current.clear();

      restoredAssets.forEach((asset) => {
        const key = String(asset?.key ?? "").trim();
        const runtimeUrl = String(asset?.runtimeUrl ?? "");
        if (key && runtimeUrl) {
          uploadedObjectUrlsRef.current.set(key, runtimeUrl);
        }
      });

      const restoredAssetUrlByKey = new Map(
        restoredAssets.map((asset) => [
          String(asset?.key ?? ""),
          String(asset?.runtimeUrl ?? ""),
        ]),
      );

      const nextScenes = (savedDraft.scenes ?? []).map((scene, index) => {
        const key = String(savedDraft.sceneImageAssetKeys?.[index] ?? "");
        const restoredRuntimeUrl = restoredAssetUrlByKey.get(key);

        return {
          ...scene,
          imageUrl:
            restoredRuntimeUrl && restoredRuntimeUrl.length
              ? restoredRuntimeUrl
              : String(scene?.imageUrl ?? ""),
        };
      });

      const restoredFloorplanUrl = restoredAssetUrlByKey.get(
        String(savedDraft.floorplanImageAssetKey ?? ""),
      );

      const fallbackScenes = (initialData?.scenes ?? []).map((scene) => ({
        name: scene.name ?? "",
        imageUrl: scene.imageUrl ?? "",
        initialViewParameters: {
          pitch: scene.initialViewParameters?.pitch ?? 0,
          yaw: scene.initialViewParameters?.yaw ?? 0,
          fov: scene.initialViewParameters?.fov ?? 110,
        },
      }));

      const scenesToUse = nextScenes.length ? nextScenes : fallbackScenes;

      setTourName(String(savedDraft.tourName ?? ""));
      setClientName(String(savedDraft.clientName ?? ""));
      setClientEmail(String(savedDraft.clientEmail ?? ""));
      setScenes(scenesToUse);
      setSceneIds(buildSceneIds(savedDraft.sceneIds ?? [], scenesToUse.length));
      setHotspotsBySceneIndex(
        (savedDraft.hotspotsBySceneIndex ?? []).length
          ? savedDraft.hotspotsBySceneIndex
          : scenesToUse.map((scene) => ({
              linkHotspots: (scene.linkHotspots ?? []).map((hotspot) => ({
                yaw: hotspot.yaw ?? "",
                pitch: hotspot.pitch ?? "",
                target: hotspot.target ?? "",
              })),
              infoHotspots: (scene.infoHotspots ?? []).map((hotspot) => ({
                yaw: hotspot.yaw ?? "",
                pitch: hotspot.pitch ?? "",
                title: hotspot.title ?? "",
                text: hotspot.text ?? "",
              })),
            })),
      );
      setFloorplanPositions(
        scenesToUse.map((scene, index) => {
          const savedPositions = savedDraft.floorplanPositions ?? [];
          const initialPositions = initialFloorplanPositions ?? [];
          const bySavedIndex = savedPositions[index];
          const byInitialId = initialPositions.find(
            (position) => position.id === scene.id,
          );
          const byInitialIndex = initialPositions[index];
          const source =
            bySavedIndex ??
            byInitialId ??
            byInitialIndex ??
            createEmptyFloorplanPosition();

          return {
            x: toRelativeFloorplanValue(source?.x),
            y: toRelativeFloorplanValue(source?.y),
          };
        }),
      );
      setFloorplanImageUrl(
        restoredFloorplanUrl && restoredFloorplanUrl.length
          ? restoredFloorplanUrl
          : String(savedDraft.floorplanImageUrl ?? initialFloorplanImageUrl),
      );
      setPreserveCurrentView(Boolean(savedDraft.preserveCurrentView));
      setAutorotateEnabled(Boolean(savedDraft.autorotateEnabled));
      setViewControlButtons(Boolean(savedDraft.viewControlButtons));
      setUploadedAssets(restoredAssets);

      didHydrateDraftRef.current = true;
      setCanPersistDraft(true);
    };

    hydrateFromSession().catch(() => {
      if (!cancelled) {
        didHydrateDraftRef.current = true;
        setCanPersistDraft(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    initialData,
    initialFloorplanImageUrl,
    initialFloorplanPositions,
    isProduction,
  ]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        PRESERVE_CURRENT_VIEW_STORAGE_KEY,
        preserveCurrentView ? "1" : "0",
      );
      if (!preserveCurrentView) {
        window.sessionStorage.removeItem(RUNTIME_VIEW_STATE_STORAGE_KEY);
      }
    } catch {}

    window.dispatchEvent(
      new CustomEvent("playground:preserve-current-view-changed", {
        detail: { enabled: preserveCurrentView },
      }),
    );
  }, [preserveCurrentView]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        AUTOROTATE_ENABLED_STORAGE_KEY,
        autorotateEnabled ? "1" : "0",
      );
      window.sessionStorage.setItem(
        VIEW_CONTROL_BUTTONS_STORAGE_KEY,
        viewControlButtons ? "1" : "0",
      );
    } catch {}

    window.dispatchEvent(
      new CustomEvent("playground:viewer-settings-changed", {
        detail: {
          autorotateEnabled,
          viewControlButtons,
        },
      }),
    );
  }, [autorotateEnabled, viewControlButtons]);

  const updateScene = (sceneIndex, patch) => {
    setScenes((prev) => {
      const next = [...prev];
      next[sceneIndex] = { ...next[sceneIndex], ...patch };
      return next;
    });
  };

  const registerUploadedAsset = (entry) => {
    const key = entry.key;
    const previousUrl = uploadedObjectUrlsRef.current.get(key);
    if (previousUrl && previousUrl !== entry.runtimeUrl) {
      revokeBlobUrl(previousUrl);
    }
    if (entry.runtimeUrl) {
      uploadedObjectUrlsRef.current.set(key, entry.runtimeUrl);
    }

    setUploadedAssets((prev) => {
      const next = prev.filter((item) => item.key !== key);
      next.push(entry);
      return next;
    });
  };

  useEffect(() => {
    return () => {
      uploadedObjectUrlsRef.current.forEach((url) => revokeBlobUrl(url));
      uploadedObjectUrlsRef.current.clear();
    };
  }, []);

  const applyUploadedImage = async ({ file, sceneIndex = null, kind }) => {
    if (!file) {
      return;
    }

    setImageLoadingState({
      active: true,
      message: `Loading ${file.name}...`,
    });

    try {
      if (!isAllowedImageFile(file)) {
        setCopyState({
          state: "error",
          message: "Only JPG, PNG or EXR files are allowed",
        });
        return;
      }

      const extension = getFileExtension(file.name);
      const isExr = extension === "exr";
      let dimensions = null;

      if (!isExr) {
        try {
          dimensions = await readImageDimensions(file);
        } catch {
          setCopyState({
            state: "error",
            message: "Could not read image dimensions",
          });
          return;
        }
      }

      if (kind === "scene" && dimensions) {
        const ratio = dimensions.width / Math.max(1, dimensions.height);
        const validRatio =
          Math.abs(ratio - SCENE_REQUIRED_ASPECT_RATIO) <=
          SCENE_ASPECT_TOLERANCE;

        if (!validRatio) {
          setCopyState({
            state: "error",
            message: "Panorama image must be close to 2:1 ratio",
          });
          return;
        }
      }

      const suggestedPath = buildClientAssetPath({
        clientName,
        filename: file.name,
      });
      const runtimeUrl = URL.createObjectURL(file);
      const sessionId =
        sessionIdRef.current || getOrCreatePlaygroundSessionId() || "";
      sessionIdRef.current = sessionId;
      const persistedBlobId = isProduction
        ? await savePlaygroundImageBlob({
            sessionId,
            kind,
            sceneIndex,
            file,
          })
        : "";

      if (kind === "floorplan") {
        setFloorplanImageUrl(runtimeUrl);
      } else if (Number.isInteger(sceneIndex) && sceneIndex >= 0) {
        updateScene(sceneIndex, { imageUrl: runtimeUrl });
      }

      registerUploadedAsset({
        key: `${kind}:${sceneIndex ?? "root"}`,
        kind,
        sceneIndex,
        fileName: file.name,
        mimeType: file.type,
        runtimeUrl,
        persistedBlobId,
        suggestedPath,
        width: dimensions?.width ?? null,
        height: dimensions?.height ?? null,
        uploadedAt: new Date().toISOString(),
      });

      setCopyState({
        state: "copied",
        message: `Loaded temporary file ${file.name}`,
      });
    } finally {
      setImageLoadingState({ active: false, message: "" });
    }
  };

  const handleFloorplanFileChange = async (event) => {
    const file = event.target.files?.[0];
    await applyUploadedImage({ file, kind: "floorplan" });
    event.target.value = "";
  };

  const handleSceneFileChange = async (sceneIndex, event) => {
    const file = event.target.files?.[0];
    await applyUploadedImage({ file, sceneIndex, kind: "scene" });
    event.target.value = "";
  };

  const updateSceneView = (sceneIndex, patch) => {
    const normalizedPatch =
      sceneIndex === 0
        ? {
            ...patch,
            ...(Object.prototype.hasOwnProperty.call(patch, "pitch") &&
            patch.pitch !== "" &&
            Number.isFinite(Number(patch.pitch))
              ? {
                  pitch: clampNumber(Number(patch.pitch), -80, 180),
                }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(patch, "yaw") &&
            patch.yaw !== "" &&
            Number.isFinite(Number(patch.yaw))
              ? {
                  yaw: clampNumber(Number(patch.yaw), 0, 359),
                }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(patch, "fov") &&
            patch.fov !== "" &&
            Number.isFinite(Number(patch.fov))
              ? {
                  fov: clampNumber(Number(patch.fov), 30, 100),
                }
              : {}),
          }
        : patch;

    setScenes((prev) => {
      const next = [...prev];
      next[sceneIndex] = {
        ...next[sceneIndex],
        initialViewParameters: {
          ...next[sceneIndex].initialViewParameters,
          ...normalizedPatch,
        },
      };
      return next;
    });
  };

  const mutateSceneHotspots = (sceneIndex, updater) => {
    setHotspotsBySceneIndex((prev) => {
      const next = [...prev];
      const currentSceneHotspots = next[sceneIndex] ?? createEmptyHotspots();
      next[sceneIndex] = updater(currentSceneHotspots);
      return next;
    });
  };

  const addLinkHotspot = (sceneIndex) => {
    mutateSceneHotspots(sceneIndex, (currentSceneHotspots) => ({
      ...currentSceneHotspots,
      linkHotspots: [
        ...(currentSceneHotspots.linkHotspots ?? []),
        createEmptyLinkHotspot(),
      ],
    }));
  };

  const removeLinkHotspot = (sceneIndex, hotspotIndex) => {
    mutateSceneHotspots(sceneIndex, (currentSceneHotspots) => ({
      ...currentSceneHotspots,
      linkHotspots: (currentSceneHotspots.linkHotspots ?? []).filter(
        (_, index) => index !== hotspotIndex,
      ),
    }));
  };

  const updateLinkHotspot = (sceneIndex, hotspotIndex, patch) => {
    const currentSceneId = String(derivedScenes?.[sceneIndex]?.id ?? "").trim();
    const rawTarget = Object.prototype.hasOwnProperty.call(patch, "target")
      ? String(patch.target ?? "").trim()
      : null;

    const normalizedPatch = {
      ...patch,
      ...(rawTarget !== null
        ? {
            target: rawTarget === currentSceneId ? "" : rawTarget,
          }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(patch, "yaw") &&
      patch.yaw !== "" &&
      Number.isFinite(Number(patch.yaw))
        ? {
            yaw: Number(patch.yaw),
          }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(patch, "pitch") &&
      patch.pitch !== "" &&
      Number.isFinite(Number(patch.pitch))
        ? {
            pitch: Number(patch.pitch),
          }
        : {}),
    };

    mutateSceneHotspots(sceneIndex, (currentSceneHotspots) => {
      const nextLinkHotspots = [...(currentSceneHotspots.linkHotspots ?? [])];
      nextLinkHotspots[hotspotIndex] = {
        ...nextLinkHotspots[hotspotIndex],
        ...normalizedPatch,
      };
      return {
        ...currentSceneHotspots,
        linkHotspots: nextLinkHotspots,
      };
    });
  };

  const startLinkHotspotLocationPick = (sceneIndex, hotspotIndex) => {
    setLinkPickState({
      sceneIndex,
      hotspotIndex,
      message: "Click on the panorama to place it",
    });

    window.dispatchEvent(
      new CustomEvent("playground:linkhotspot-pick-start", {
        detail: { sceneIndex, hotspotIndex },
      }),
    );
  };

  useEffect(() => {
    const handleLinkPickResult = (event) => {
      const detail = event?.detail ?? {};
      const sceneIndex = Number(detail.sceneIndex);
      const hotspotIndex = Number(detail.hotspotIndex);

      if (!Number.isInteger(sceneIndex) || !Number.isInteger(hotspotIndex)) {
        return;
      }

      if (detail.status === "ok") {
        updateLinkHotspot(sceneIndex, hotspotIndex, {
          yaw: detail.yaw,
          pitch: detail.pitch,
        });
        setLinkPickState({
          sceneIndex: null,
          hotspotIndex: null,
          message: "",
        });
        return;
      }

      setLinkPickState((prev) => {
        if (
          prev.sceneIndex !== sceneIndex ||
          prev.hotspotIndex !== hotspotIndex
        ) {
          return prev;
        }

        return {
          ...prev,
          message: "Fail, retry",
        };
      });
    };

    window.addEventListener(
      "playground:linkhotspot-pick-result",
      handleLinkPickResult,
    );

    return () => {
      window.removeEventListener(
        "playground:linkhotspot-pick-result",
        handleLinkPickResult,
      );
    };
  }, []);

  useEffect(() => {
    const handleLinkHotspotCommit = (event) => {
      const detail = event?.detail ?? {};
      const sceneId = String(detail.sceneId ?? "").trim();
      const hotspotIndex = Number(detail.hotspotIndex);

      if (!sceneId || !Number.isInteger(hotspotIndex)) {
        return;
      }

      const sceneIndex = derivedScenes.findIndex(
        (scene) => scene.id === sceneId,
      );
      if (sceneIndex < 0) {
        return;
      }

      updateLinkHotspot(sceneIndex, hotspotIndex, {
        yaw: detail.yaw,
        pitch: detail.pitch,
      });
    };

    window.addEventListener(
      "playground:linkhotspot-position-commit",
      handleLinkHotspotCommit,
    );

    return () => {
      window.removeEventListener(
        "playground:linkhotspot-position-commit",
        handleLinkHotspotCommit,
      );
    };
  }, [derivedScenes]);

  const addInfoHotspot = (sceneIndex) => {
    mutateSceneHotspots(sceneIndex, (currentSceneHotspots) => ({
      ...currentSceneHotspots,
      infoHotspots: [
        ...(currentSceneHotspots.infoHotspots ?? []),
        createEmptyInfoHotspot(),
      ],
    }));
  };

  const removeInfoHotspot = (sceneIndex, hotspotIndex) => {
    mutateSceneHotspots(sceneIndex, (currentSceneHotspots) => ({
      ...currentSceneHotspots,
      infoHotspots: (currentSceneHotspots.infoHotspots ?? []).filter(
        (_, index) => index !== hotspotIndex,
      ),
    }));
  };

  const updateInfoHotspot = (sceneIndex, hotspotIndex, patch) => {
    const normalizedPatch = {
      ...patch,
      ...(Object.prototype.hasOwnProperty.call(patch, "yaw") &&
      patch.yaw !== "" &&
      Number.isFinite(Number(patch.yaw))
        ? {
            yaw: Number(patch.yaw),
          }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(patch, "pitch") &&
      patch.pitch !== "" &&
      Number.isFinite(Number(patch.pitch))
        ? {
            pitch: Number(patch.pitch),
          }
        : {}),
    };
    mutateSceneHotspots(sceneIndex, (currentSceneHotspots) => {
      const nextInfoHotspots = [...(currentSceneHotspots.infoHotspots ?? [])];
      nextInfoHotspots[hotspotIndex] = {
        ...nextInfoHotspots[hotspotIndex],
        ...normalizedPatch,
      };
      return {
        ...currentSceneHotspots,
        infoHotspots: nextInfoHotspots,
      };
    });
  };

  const startInfoHotspotLocationPick = (sceneIndex, hotspotIndex) => {
    setInfoPickState({
      sceneIndex,
      hotspotIndex,
      message: "Click on the panorama to place it",
    });

    window.dispatchEvent(
      new CustomEvent("playground:infohotspot-pick-start", {
        detail: { sceneIndex, hotspotIndex },
      }),
    );
  };

  useEffect(() => {
    const handlePickResult = (event) => {
      const detail = event?.detail ?? {};
      const sceneIndex = Number(detail.sceneIndex);
      const hotspotIndex = Number(detail.hotspotIndex);

      if (!Number.isInteger(sceneIndex) || !Number.isInteger(hotspotIndex)) {
        return;
      }

      if (detail.status === "ok") {
        updateInfoHotspot(sceneIndex, hotspotIndex, {
          yaw: detail.yaw,
          pitch: detail.pitch,
        });
        setInfoPickState({
          sceneIndex: null,
          hotspotIndex: null,
          message: "",
        });
        return;
      }

      setInfoPickState((prev) => {
        if (
          prev.sceneIndex !== sceneIndex ||
          prev.hotspotIndex !== hotspotIndex
        ) {
          return prev;
        }
        return {
          ...prev,
          message: "Fail, retry",
        };
      });
    };

    window.addEventListener(
      "playground:infohotspot-pick-result",
      handlePickResult,
    );

    return () => {
      window.removeEventListener(
        "playground:infohotspot-pick-result",
        handlePickResult,
      );
    };
  }, []);

  useEffect(() => {
    const handleInfoHotspotCommit = (event) => {
      const detail = event?.detail ?? {};
      const sceneId = String(detail.sceneId ?? "").trim();
      const hotspotIndex = Number(detail.hotspotIndex);

      if (!sceneId || !Number.isInteger(hotspotIndex)) {
        return;
      }

      const sceneIndex = derivedScenes.findIndex(
        (scene) => scene.id === sceneId,
      );
      if (sceneIndex < 0) {
        return;
      }

      updateInfoHotspot(sceneIndex, hotspotIndex, {
        yaw: detail.yaw,
        pitch: detail.pitch,
      });
    };

    window.addEventListener(
      "playground:infohotspot-position-commit",
      handleInfoHotspotCommit,
    );

    return () => {
      window.removeEventListener(
        "playground:infohotspot-position-commit",
        handleInfoHotspotCommit,
      );
    };
  }, [derivedScenes]);

  const updateFloorplanPosition = (sceneIndex, patch) => {
    const normalizedPatch = {
      ...patch,
      ...(Object.prototype.hasOwnProperty.call(patch, "x") &&
      patch.x !== "" &&
      Number.isFinite(Number(patch.x))
        ? {
            x: clampNumber(Number(patch.x), 0, 1),
          }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(patch, "y") &&
      patch.y !== "" &&
      Number.isFinite(Number(patch.y))
        ? {
            y: clampNumber(Number(patch.y), 0, 1),
          }
        : {}),
    };

    setFloorplanPositions((prev) => {
      const next = [...prev];
      next[sceneIndex] = { ...next[sceneIndex], ...normalizedPatch };
      return next;
    });
  };

  useEffect(() => {
    const handleFloorplanCommit = (event) => {
      const detail = event?.detail;
      const sceneId = String(detail?.sceneId ?? "").trim();
      if (!sceneId) {
        return;
      }

      const sceneIndex = derivedScenes.findIndex(
        (scene) => scene.id === sceneId,
      );
      if (sceneIndex < 0) {
        return;
      }

      updateFloorplanPosition(sceneIndex, {
        x: detail?.x,
        y: detail?.y,
      });
    };

    window.addEventListener(
      "playground:floorplan-position-commit",
      handleFloorplanCommit,
    );

    return () => {
      window.removeEventListener(
        "playground:floorplan-position-commit",
        handleFloorplanCommit,
      );
    };
  }, [derivedScenes]);

  const addScene = () => {
    const newSceneIndex = scenes.length;
    setScenes((prev) => [...prev, createEmptyScene()]);
    setSceneIds((prev) => buildSceneIds([...prev, ""], prev.length + 1));
    setHotspotsBySceneIndex((prev) => [...prev, createEmptyHotspots()]);
    setFloorplanPositions((prev) => [...prev, createEmptyFloorplanPosition()]);
    setExpandedSceneIndexes([newSceneIndex]);
  };

  const removeScene = (sceneIndex) => {
    const hasSingleScene = scenes.length <= 1;

    if (hasSingleScene) {
      setScenes([createEmptyScene()]);
      setSceneIds([createDefaultSceneId(0)]);
      setHotspotsBySceneIndex([createEmptyHotspots()]);
      setFloorplanPositions([createEmptyFloorplanPosition()]);
      setExpandedSceneIndexes([0]);
      return;
    }

    setScenes((prev) => prev.filter((_, index) => index !== sceneIndex));
    setSceneIds((prev) => prev.filter((_, index) => index !== sceneIndex));
    setHotspotsBySceneIndex((prev) =>
      prev.filter((_, index) => index !== sceneIndex),
    );
    setFloorplanPositions((prev) =>
      prev.filter((_, index) => index !== sceneIndex),
    );

    setExpandedSceneIndexes((prev) => {
      const filtered = (prev ?? []).filter((index) => index !== sceneIndex);
      return filtered.map((index) => (index > sceneIndex ? index - 1 : index));
    });
  };

  const toggleSceneExpanded = (sceneIndex) => {
    setExpandedSceneIndexes((prev) => {
      const current = prev ?? [];
      if (current.includes(sceneIndex)) {
        return current.filter((index) => index !== sceneIndex);
      }
      return [...current, sceneIndex];
    });
  };

  const writeDataInDev = async (content, notifySuccess = false) => {
    const response = await fetch("/__playground/write-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result?.error || "Could not overwrite data.js");
    }

    if (notifySuccess) {
      setCopyState({
        state: "copied",
        message: "Overwrote playground/data.js",
      });
    }
  };

  const scheduleAutoWrite = () => {
    if (!canPersistDraft || !didHydrateDraftRef.current) {
      return;
    }

    if (isProduction) {
      if (autoWriteTimerRef.current) {
        window.clearTimeout(autoWriteTimerRef.current);
      }

      autoWriteTimerRef.current = window.setTimeout(() => {
        try {
          writeDraftInBrowser(false);
        } catch (error) {
          setCopyState({
            state: "error",
            message:
              error instanceof Error
                ? error.message
                : "Failed to auto-save draft in session",
          });
        }
      }, 300);
      return;
    }

    if (autoWriteTimerRef.current) {
      window.clearTimeout(autoWriteTimerRef.current);
    }

    autoWriteTimerRef.current = window.setTimeout(async () => {
      try {
        await writeDataInDev(output, false);
      } catch (error) {
        setCopyState({
          state: "error",
          message:
            error instanceof Error
              ? error.message
              : "Failed to auto-save data.js",
        });
      }
    }, 300);
  };

  useEffect(() => {
    scheduleAutoWrite();
  }, [
    output,
    clientName,
    clientEmail,
    preserveCurrentView,
    canPersistDraft,
    scenes,
    sceneIds,
    hotspotsBySceneIndex,
    floorplanPositions,
    floorplanImageUrl,
    uploadedAssets,
  ]);

  const onGenerate = async () => {
    try {
      if (sceneNameError) {
        setCopyState({ state: "error", message: sceneNameError });
        return;
      }

      await copyToClipboard(output);
      if (!isProduction) {
        writeDataInDev(output, false).catch(() => {});
      } else {
        writeDraftInBrowser(false);
      }
      setCopyState({
        state: "copied",
        message: "Copied data.js to clipboard",
      });
      window.setTimeout(
        () => setCopyState({ state: "idle", message: "" }),
        1500,
      );
    } catch (error) {
      setCopyState({
        state: "error",
        message:
          error instanceof Error ? error.message : "Failed to generate data.js",
      });
    }
  };

  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2.5 py-2"
      id="playground-form"
      onBlurCapture={(event) => {
        const tagName = event.target?.tagName;
        if (["INPUT", "SELECT", "TEXTAREA"].includes(tagName)) {
          scheduleAutoWrite();
        }
      }}
      onKeyDownCapture={(event) => {
        const tagName = event.target?.tagName;
        if (event.key === "Enter" && tagName !== "TEXTAREA") {
          scheduleAutoWrite();
        }
      }}
    >
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-slate-700">Tour name</span>
        <input
          className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs"
          value={tourName}
          onChange={(e) => setTourName(e.target.value)}
        />
      </label>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold tracking-wide text-slate-700">
          Floorplan image
        </span>
        <button
          type="button"
          className="inline-flex h-8 w-fit items-center rounded border border-black/10 bg-white px-2.5 text-[10px] font-semibold text-slate-700"
          onClick={() => floorplanFileInputRef.current?.click()}
          disabled={imageLoadingState.active}
        >
          Upload
        </button>
        <input
          ref={floorplanFileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.exr,image/jpeg,image/png,image/x-exr,image/exr"
          className="hidden"
          disabled={imageLoadingState.active}
          onChange={handleFloorplanFileChange}
        />
      </div>

      {imageLoadingState.active ? (
        <div className="inline-flex items-center gap-2 text-[11px] font-medium text-slate-600">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
          <span>{imageLoadingState.message || "Loading image..."}</span>
        </div>
      ) : null}

      <div className="mt-1">
        <div className="flex items-center justify-between gap-2 text-xs font-bold tracking-wide text-slate-700">
          <span>Scenes</span>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded border border-black/10 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700"
            onClick={addScene}
            aria-label="Add scene"
            title="Add scene"
          >
            +
          </button>
        </div>
        <div className="mt-1 grid grid-cols-1 gap-1 text-[11px] text-slate-700">
          <label className="inline-flex items-center gap-1">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border border-black/20"
              checked={preserveCurrentView}
              onChange={(event) => setPreserveCurrentView(event.target.checked)}
            />
            Preserve current view
          </label>
          <label className="inline-flex items-center gap-1">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border border-black/20"
              checked={autorotateEnabled}
              onChange={(event) => setAutorotateEnabled(event.target.checked)}
            />
            autorotateEnabled
          </label>
          <label className="inline-flex items-center gap-1">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border border-black/20"
              checked={viewControlButtons}
              onChange={(event) => setViewControlButtons(event.target.checked)}
            />
            viewControlButtons
          </label>
        </div>
        <div className="mt-1 flex flex-col gap-1.5">
          {derivedScenes.map((scene, index) => (
            <div
              key={index}
              ref={(node) => {
                if (node) {
                  sceneCardRefs.current.set(index, node);
                } else {
                  sceneCardRefs.current.delete(index);
                }
              }}
              className={`rounded-md bg-white p-1 ring-1 ring-black/5 transition-shadow ${activeSceneId === scene.id ? "outline outline-1 outline-sky-400/70 shadow-[0_0_0_1px_rgba(56,189,248,0.25)]" : ""}`}
            >
              <div className="mb-1 flex items-center justify-between gap-2 text-xs font-semibold text-slate-700">
                <div className="min-w-0">
                  <span className="truncate">
                    {scene.name?.trim() || `Scene ${index + 1}`}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className="inline-flex h-5 w-5 items-center justify-center rounded border border-black/10 bg-white text-[11px] font-bold text-slate-700"
                    onClick={() => toggleSceneExpanded(index)}
                    aria-label={
                      expandedSceneIndexes.includes(index)
                        ? "Collapse scene"
                        : "Expand scene"
                    }
                    title={
                      expandedSceneIndexes.includes(index)
                        ? "Collapse"
                        : "Expand"
                    }
                  >
                    {expandedSceneIndexes.includes(index) ? "−" : "+"}
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-5 w-5 items-center justify-center rounded border border-black/10 bg-white text-[11px] text-slate-700"
                    onClick={() => removeScene(index)}
                    aria-label="Delete scene"
                    title="Delete scene"
                  >
                    🗑
                  </button>
                </div>
              </div>

              {expandedSceneIndexes.includes(index) ? (
                <div className="grid grid-cols-1 gap-1">
                  <label className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-semibold text-slate-700">
                      Name
                    </span>
                    <input
                      className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs"
                      value={scene.name}
                      onChange={(e) =>
                        updateScene(index, { name: e.target.value })
                      }
                    />
                  </label>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-semibold text-slate-700">
                      Image
                    </span>
                    <button
                      type="button"
                      className="inline-flex h-8 w-fit items-center rounded border border-black/10 bg-white px-2.5 text-[10px] font-semibold text-slate-700"
                      onClick={() => sceneFileInputRefs.current[index]?.click()}
                      disabled={imageLoadingState.active}
                    >
                      Upload
                    </button>
                    <input
                      ref={(node) => {
                        if (node) {
                          sceneFileInputRefs.current[index] = node;
                        } else {
                          delete sceneFileInputRefs.current[index];
                        }
                      }}
                      type="file"
                      accept=".jpg,.jpeg,.png,.exr,image/jpeg,image/png,image/x-exr,image/exr"
                      className="hidden"
                      disabled={imageLoadingState.active}
                      onChange={(event) => handleSceneFileChange(index, event)}
                    />
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-semibold text-slate-700">
                      Minimap position
                    </span>
                    <div className="grid grid-cols-2 gap-1">
                      <DraggableNumberInput
                        className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs"
                        value={floorplanPositions[index]?.x ?? ""}
                        onChangeValue={(nextValue) =>
                          updateFloorplanPosition(index, {
                            x: nextValue,
                          })
                        }
                        min={0}
                        max={1}
                        dragStep={0.01}
                        wheelStep={0.05}
                        precision={3}
                        placeholder="0.58"
                        aria-label="Position x"
                      />
                      <DraggableNumberInput
                        className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs"
                        value={floorplanPositions[index]?.y ?? ""}
                        onChangeValue={(nextValue) =>
                          updateFloorplanPosition(index, {
                            y: nextValue,
                          })
                        }
                        min={0}
                        max={1}
                        dragStep={0.01}
                        wheelStep={0.05}
                        precision={3}
                        placeholder="0.32"
                        aria-label="Position y"
                      />
                    </div>
                  </div>

                  {index === 0 ? (
                    <>
                      <span className="text-[10px] font-medium text-slate-500">
                        Initial view parameters
                      </span>
                      <div className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-1">
                        <label className="min-w-0 flex flex-col gap-0.5">
                          <span className="text-[11px] font-semibold text-slate-700">
                            Pitch
                          </span>
                          <DraggableNumberInput
                            className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs"
                            value={scene.initialViewParameters.pitch}
                            onChangeValue={(nextValue) =>
                              updateSceneView(index, { pitch: nextValue })
                            }
                            min={-80}
                            max={180}
                            wheelStep={5}
                            dragStep={1}
                            ariaLabel="Initial pitch"
                          />
                        </label>
                        <label className="min-w-0 flex flex-col gap-0.5">
                          <span className="text-[11px] font-semibold text-slate-700">
                            Yaw
                          </span>
                          <DraggableNumberInput
                            className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs"
                            value={scene.initialViewParameters.yaw}
                            onChangeValue={(nextValue) =>
                              updateSceneView(index, { yaw: nextValue })
                            }
                            min={0}
                            max={359}
                            wheelStep={5}
                            dragStep={1}
                            ariaLabel="Initial yaw"
                          />
                        </label>
                        <label className="min-w-0 flex flex-col gap-0.5">
                          <span className="text-[11px] font-semibold text-slate-700">
                            FOV
                          </span>
                          <DraggableNumberInput
                            className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs"
                            value={scene.initialViewParameters.fov}
                            onChangeValue={(nextValue) =>
                              updateSceneView(index, { fov: nextValue })
                            }
                            min={30}
                            max={150}
                            wheelStep={5}
                            dragStep={1}
                            ariaLabel="Initial fov"
                          />
                        </label>
                      </div>
                    </>
                  ) : null}

                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-700">
                        Link hotspots
                      </span>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded border border-black/10 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-700"
                        onClick={() => addLinkHotspot(index)}
                      >
                        +
                      </button>
                    </div>

                    <div className="flex flex-col gap-1">
                      {(hotspotsBySceneIndex[index]?.linkHotspots ?? []).map(
                        (hotspot, hotspotIndex) => {
                          const currentSceneId = String(
                            derivedScenes[index]?.id ?? "",
                          ).trim();
                          const targetOptions = derivedScenes.filter(
                            (candidate) =>
                              String(candidate.id ?? "").trim().length,
                          );
                          const selectableTargets = targetOptions.filter(
                            (candidate) => candidate.id !== currentSceneId,
                          );
                          const selectedTarget = selectableTargets.some(
                            (candidate) => candidate.id === hotspot.target,
                          )
                            ? hotspot.target
                            : (selectableTargets[0]?.id ?? "");

                          return (
                            <div
                              key={`link-${index}-${hotspotIndex}`}
                              className="grid grid-cols-[auto_minmax(0,1.2fr)_auto] items-center gap-1"
                            >
                              <button
                                type="button"
                                className="inline-flex h-7 items-center justify-center rounded border border-black/10 bg-white px-2 text-[10px] font-semibold text-slate-700"
                                onClick={() => {
                                  if (
                                    selectedTarget &&
                                    selectedTarget !== hotspot.target
                                  ) {
                                    updateLinkHotspot(index, hotspotIndex, {
                                      target: selectedTarget,
                                    });
                                  }
                                  startLinkHotspotLocationPick(
                                    index,
                                    hotspotIndex,
                                  );
                                }}
                                aria-label="Define link hotspot location"
                              >
                                {linkPickState.sceneIndex === index &&
                                linkPickState.hotspotIndex === hotspotIndex
                                  ? "Click to place"
                                  : "Define location"}
                              </button>
                              <select
                                className="min-w-0 rounded-md border border-black/10 bg-white px-2 py-1 text-xs"
                                value={selectedTarget}
                                onChange={(e) =>
                                  updateLinkHotspot(index, hotspotIndex, {
                                    target: e.target.value,
                                  })
                                }
                                aria-label="Link hotspot target"
                              >
                                {!selectableTargets.length ? (
                                  <option value="">
                                    No target scenes available
                                  </option>
                                ) : null}
                                {targetOptions.map((candidate) => (
                                  <option
                                    key={candidate.id}
                                    value={candidate.id}
                                    disabled={candidate.id === currentSceneId}
                                  >
                                    {candidate.id}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                className="inline-flex h-5 w-5 items-center justify-center self-center justify-self-end rounded border border-black/10 bg-white p-0 text-[9px] text-slate-700"
                                onClick={() =>
                                  removeLinkHotspot(index, hotspotIndex)
                                }
                                aria-label="Remove link hotspot"
                              >
                                −
                              </button>
                            </div>
                          );
                        },
                      )}
                      {linkPickState.message ? (
                        <span className="text-[10px] font-medium text-slate-500">
                          {linkPickState.message}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-700">
                        Info hotspots
                      </span>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded border border-black/10 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-700"
                        onClick={() => addInfoHotspot(index)}
                      >
                        +
                      </button>
                    </div>

                    <div className="flex flex-col gap-1">
                      {(hotspotsBySceneIndex[index]?.infoHotspots ?? []).map(
                        (hotspot, hotspotIndex) => {
                          return (
                            <div
                              key={`info-${index}-${hotspotIndex}`}
                              className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1.2fr)_auto] items-center gap-1"
                            >
                              <button
                                type="button"
                                className="inline-flex h-7 items-center justify-center rounded border border-black/10 bg-white px-2 text-[10px] font-semibold text-slate-700"
                                onClick={() =>
                                  startInfoHotspotLocationPick(
                                    index,
                                    hotspotIndex,
                                  )
                                }
                                aria-label="Define info hotspot location"
                              >
                                {infoPickState.sceneIndex === index &&
                                infoPickState.hotspotIndex === hotspotIndex
                                  ? "Click to place"
                                  : "Define location"}
                              </button>
                              <input
                                className="min-w-0 rounded-md border border-black/10 bg-white px-2 py-1 text-xs"
                                placeholder="title"
                                value={hotspot.title}
                                onChange={(e) =>
                                  updateInfoHotspot(index, hotspotIndex, {
                                    title: e.target.value,
                                  })
                                }
                                aria-10label="Info hotspot title"
                              />
                              <input
                                className="min-w-0 rounded-md border border-black/10 bg-white px-2 py-1 text-xs"
                                placeholder="description"
                                value={hotspot.text}
                                onChange={(e) =>
                                  updateInfoHotspot(index, hotspotIndex, {
                                    text: e.target.value,
                                  })
                                }
                                aria-label="Info hotspot text"
                              />
                              <button
                                type="button"
                                className="inline-flex h-5 w-5 items-center justify-center self-center justify-self-end rounded border border-black/10 bg-white p-0 text-[9px] text-slate-700"
                                onClick={() =>
                                  removeInfoHotspot(index, hotspotIndex)
                                }
                                aria-label="Remove info hotspot"
                              >
                                −
                              </button>
                            </div>
                          );
                        },
                      )}
                      {infoPickState.message ? (
                        <span className="text-[10px] font-medium text-slate-500">
                          {infoPickState.message}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-1.5 flex flex-col gap-2">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-slate-700">
              Name *
            </span>
            <input
              className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs"
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-slate-700">
              Email *
            </span>
            <input
              type="email"
              className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs"
              value={clientEmail}
              onChange={(event) => setClientEmail(event.target.value)}
            />
          </label>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
            onClick={onGenerate}
            disabled={Boolean(sceneNameError)}
          >
            Generate data.js
          </button>
        </div>

        <div className="text-xs text-slate-600" aria-live="polite">
          {sceneNameError ||
            (copyState.state === "error" ? copyState.message : "")}
        </div>
      </div>
    </div>
  );
}
