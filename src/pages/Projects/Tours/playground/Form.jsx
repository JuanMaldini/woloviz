import { useEffect, useMemo, useRef, useState } from "react";

const SETTINGS_DEFAULTS = {
  mouseViewMode: "drag",
  autorotateEnabled: false,
  fullscreenButton: true,
  viewControlButtons: true,
};

const EQUIRECT_WIDTH_DEFAULT = 4000;

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
  x: 0,
  y: 0,
});

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

function formatSceneId(name) {
  const base = String(name ?? "")
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
    .toLowerCase();

  const slug = base
    .replace(/[^a-z0-9\s-_]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "scene";
}

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

function buildSceneSnippet(
  scene,
  { linkHotspots, infoHotspots, includeInitialViewParameters },
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
  lines.push(`  imageUrl: ${JSON.stringify(base.imageUrl)},`);
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
    const title = String(hotspot.title ?? "").trim();
    const text = String(hotspot.text ?? "").trim();
    if (!title && !text) {
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
}) {
  const normalizedPositions = scenes
    .map((scene, index) => ({
      id: String(scene.id || "").trim(),
      x: toNumberOr(floorplanPositions?.[index]?.x, 0),
      y: toNumberOr(floorplanPositions?.[index]?.y, 0),
    }))
    .filter((position) => position.id.length > 0);

  const sceneSnippets = scenes.map((scene, index) =>
    buildSceneSnippet(scene, {
      ...(hotspotsBySceneIndex[index] ?? {
        linkHotspots: [],
        infoHotspots: [],
      }),
      includeInitialViewParameters: index === 0,
    }),
  );

  const lines = [];

  lines.push("// Generated from /playground");
  lines.push(
    "// Percentage-based positions so markers stay aligned on resize.",
  );
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
  lines.push(
    `    mouseViewMode: ${JSON.stringify(SETTINGS_DEFAULTS.mouseViewMode)},`,
  );
  lines.push(
    `    autorotateEnabled: ${Boolean(SETTINGS_DEFAULTS.autorotateEnabled)},`,
  );
  lines.push(
    `    fullscreenButton: ${Boolean(SETTINGS_DEFAULTS.fullscreenButton)},`,
  );
  lines.push(
    `    viewControlButtons: ${Boolean(SETTINGS_DEFAULTS.viewControlButtons)},`,
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

export default function Form({
  initialData,
  initialFloorplanPositions,
  initialFloorplanImageUrl = "",
}) {
  const isProduction = import.meta.env.PROD;
  const autoWriteTimerRef = useRef(null);
  const [tourName, setTourName] = useState(() => initialData?.name ?? "");

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
    (initialData?.scenes ?? []).map((scene) =>
      String(scene.id || "").trim()
        ? String(scene.id).trim()
        : formatSceneId(scene.name),
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
        x: source.x ?? 0,
        y: source.y ?? 0,
      };
    });
  });

  const [floorplanImageUrl, setFloorplanImageUrl] = useState(
    () => initialFloorplanImageUrl,
  );

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

  const [expandedSceneIndex, setExpandedSceneIndex] = useState(0);

  const derivedScenes = useMemo(() => {
    return scenes.map((scene, index) => ({
      ...scene,
      id: sceneIds[index] ?? formatSceneId(scene.name),
    }));
  }, [scenes, sceneIds]);

  const sceneNameError = useMemo(
    () => getDuplicateSceneNameError(scenes),
    [scenes],
  );

  const [copyState, setCopyState] = useState({ state: "idle", message: "" });

  const output = useMemo(
    () =>
      buildOutput({
        tourName,
        scenes: derivedScenes,
        floorplanImageUrl,
        hotspotsBySceneIndex,
        floorplanPositions,
      }),
    [
      tourName,
      derivedScenes,
      floorplanImageUrl,
      hotspotsBySceneIndex,
      floorplanPositions,
    ],
  );

  const updateScene = (sceneIndex, patch) => {
    setScenes((prev) => {
      const next = [...prev];
      next[sceneIndex] = { ...next[sceneIndex], ...patch };
      return next;
    });
  };

  const updateSceneView = (sceneIndex, patch) => {
    setScenes((prev) => {
      const next = [...prev];
      next[sceneIndex] = {
        ...next[sceneIndex],
        initialViewParameters: {
          ...next[sceneIndex].initialViewParameters,
          ...patch,
        },
      };
      return next;
    });
  };

  const commitSceneId = (sceneIndex) => {
    setSceneIds((prev) => {
      const next = [...prev];
      next[sceneIndex] = formatSceneId(scenes[sceneIndex]?.name);
      return next;
    });
  };

  const updateHotspotCode = (sceneIndex, patch) => {
    setHotspotsBySceneIndex((prev) => {
      const next = [...prev];
      next[sceneIndex] = { ...next[sceneIndex], ...patch };
      return next;
    });
  };

  const addLinkHotspot = (sceneIndex) => {
    const current = hotspotsBySceneIndex[sceneIndex]?.linkHotspots ?? [];
    updateHotspotCode(sceneIndex, {
      linkHotspots: [...current, createEmptyLinkHotspot()],
    });
  };

  const removeLinkHotspot = (sceneIndex, hotspotIndex) => {
    const current = hotspotsBySceneIndex[sceneIndex]?.linkHotspots ?? [];
    updateHotspotCode(sceneIndex, {
      linkHotspots: current.filter((_, index) => index !== hotspotIndex),
    });
  };

  const updateLinkHotspot = (sceneIndex, hotspotIndex, patch) => {
    const current = hotspotsBySceneIndex[sceneIndex]?.linkHotspots ?? [];
    const next = [...current];
    next[hotspotIndex] = { ...next[hotspotIndex], ...patch };
    updateHotspotCode(sceneIndex, { linkHotspots: next });
  };

  const addInfoHotspot = (sceneIndex) => {
    const current = hotspotsBySceneIndex[sceneIndex]?.infoHotspots ?? [];
    updateHotspotCode(sceneIndex, {
      infoHotspots: [...current, createEmptyInfoHotspot()],
    });
  };

  const removeInfoHotspot = (sceneIndex, hotspotIndex) => {
    const current = hotspotsBySceneIndex[sceneIndex]?.infoHotspots ?? [];
    updateHotspotCode(sceneIndex, {
      infoHotspots: current.filter((_, index) => index !== hotspotIndex),
    });
  };

  const updateInfoHotspot = (sceneIndex, hotspotIndex, patch) => {
    const current = hotspotsBySceneIndex[sceneIndex]?.infoHotspots ?? [];
    const next = [...current];
    next[hotspotIndex] = { ...next[hotspotIndex], ...patch };
    updateHotspotCode(sceneIndex, { infoHotspots: next });
  };

  const updateFloorplanPosition = (sceneIndex, patch) => {
    setFloorplanPositions((prev) => {
      const next = [...prev];
      next[sceneIndex] = { ...next[sceneIndex], ...patch };
      return next;
    });
  };

  const addScene = () => {
    setScenes((prev) => [...prev, createEmptyScene()]);
    setSceneIds((prev) => [...prev, formatSceneId("")]);
    setHotspotsBySceneIndex((prev) => [...prev, createEmptyHotspots()]);
    setFloorplanPositions((prev) => [...prev, createEmptyFloorplanPosition()]);
    setExpandedSceneIndex(scenes.length);
  };

  const removeScene = (sceneIndex) => {
    const hasSingleScene = scenes.length <= 1;

    if (hasSingleScene) {
      setScenes([createEmptyScene()]);
      setSceneIds([formatSceneId("")]);
      setHotspotsBySceneIndex([createEmptyHotspots()]);
      setFloorplanPositions([createEmptyFloorplanPosition()]);
      setExpandedSceneIndex(0);
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

    setExpandedSceneIndex((prev) => {
      if (prev === null || prev === undefined) {
        return 0;
      }
      if (prev === sceneIndex) {
        return Math.max(0, sceneIndex - 1);
      }
      if (prev > sceneIndex) {
        return prev - 1;
      }
      return prev;
    });
  };

  const toggleSceneExpanded = (sceneIndex) => {
    setExpandedSceneIndex((prev) => (prev === sceneIndex ? null : sceneIndex));
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
    if (isProduction) {
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
    }, 150);
  };

  useEffect(() => {
    scheduleAutoWrite();
  }, [output]);

  const onGenerate = async () => {
    try {
      if (sceneNameError) {
        setCopyState({ state: "error", message: sceneNameError });
        return;
      }
      if (isProduction) {
        downloadTextFile("data.js", output);
        setCopyState({ state: "copied", message: "Downloaded data.js" });
      } else {
        await writeDataInDev(output, true);
      }
      window.setTimeout(
        () => setCopyState({ state: "idle", message: "" }),
        1500,
      );
    } catch (error) {
      console.error("Failed to generate data.js", error);
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
          placeholder="Sample AI Tour"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold tracking-wide text-slate-700">
          Floorplan image URL
        </span>
        <input
          className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs"
          value={floorplanImageUrl}
          onChange={(e) => setFloorplanImageUrl(e.target.value)}
          placeholder="/projects/Sampleai/Floorplan.png"
        />
      </label>

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
        <div className="mt-1 flex flex-col gap-1.5">
          {derivedScenes.map((scene, index) => (
            <div
              key={index}
              className="rounded-md bg-white p-1 ring-1 ring-black/5"
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
                      expandedSceneIndex === index
                        ? "Collapse scene"
                        : "Expand scene"
                    }
                    title={expandedSceneIndex === index ? "Collapse" : "Expand"}
                  >
                    {expandedSceneIndex === index ? "−" : "+"}
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

              {expandedSceneIndex === index ? (
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
                      onBlur={() => commitSceneId(index)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                        }
                      }}
                      placeholder="Scene 1"
                    />
                  </label>

                  <label className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-semibold text-slate-700">
                      Image URL
                    </span>
                    <input
                      className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs"
                      value={scene.imageUrl}
                      onChange={(e) =>
                        updateScene(index, { imageUrl: e.target.value })
                      }
                      placeholder="/projects/Sampleai/Sample_AI09_01.jpg"
                    />
                  </label>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-semibold text-slate-700">
                      Floorplan position
                    </span>
                    <div className="grid grid-cols-2 gap-1">
                      <input
                        className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs"
                        value={floorplanPositions[index]?.x ?? ""}
                        onChange={(e) =>
                          updateFloorplanPosition(index, {
                            x: e.target.value,
                          })
                        }
                        placeholder="58"
                        aria-label="Position x"
                      />
                      <input
                        className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs"
                        value={floorplanPositions[index]?.y ?? ""}
                        onChange={(e) =>
                          updateFloorplanPosition(index, {
                            y: e.target.value,
                          })
                        }
                        placeholder="32"
                        aria-label="Position y"
                      />
                    </div>
                  </div>

                  {index === 0 ? (
                    <>
                      <span className="text-[10px] font-medium text-slate-500">
                        Initial view parameters
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <label className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-semibold text-slate-700">
                            Pitch
                          </span>
                          <input
                            className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs"
                            value={scene.initialViewParameters.pitch}
                            onChange={(e) =>
                              updateSceneView(index, { pitch: e.target.value })
                            }
                          />
                        </label>
                        <label className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-semibold text-slate-700">
                            Yaw
                          </span>
                          <input
                            className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs"
                            value={scene.initialViewParameters.yaw}
                            onChange={(e) =>
                              updateSceneView(index, { yaw: e.target.value })
                            }
                          />
                        </label>
                        <label className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-semibold text-slate-700">
                            FOV
                          </span>
                          <input
                            className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs"
                            value={scene.initialViewParameters.fov}
                            onChange={(e) =>
                              updateSceneView(index, { fov: e.target.value })
                            }
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
                          const targetOptions = derivedScenes;

                          return (
                            <div
                              key={`link-${index}-${hotspotIndex}`}
                              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto] items-center gap-1"
                            >
                              <input
                                className="min-w-0 rounded-md border border-black/10 bg-white px-2 py-1 text-xs"
                                placeholder="yaw"
                                value={hotspot.yaw}
                                onChange={(e) =>
                                  updateLinkHotspot(index, hotspotIndex, {
                                    yaw: e.target.value,
                                  })
                                }
                                aria-label="Link hotspot yaw"
                              />
                              <input
                                className="min-w-0 rounded-md border border-black/10 bg-white px-2 py-1 text-xs"
                                placeholder="pitch"
                                value={hotspot.pitch}
                                onChange={(e) =>
                                  updateLinkHotspot(index, hotspotIndex, {
                                    pitch: e.target.value,
                                  })
                                }
                                aria-label="Link hotspot pitch"
                              />
                              <select
                                className="min-w-0 rounded-md border border-black/10 bg-white px-2 py-1 text-xs"
                                value={hotspot.target}
                                onChange={(e) =>
                                  updateLinkHotspot(index, hotspotIndex, {
                                    target: e.target.value,
                                  })
                                }
                                aria-label="Link hotspot target"
                              >
                                <option value="">scene</option>
                                {targetOptions.map((candidate) => (
                                  <option
                                    key={candidate.id}
                                    value={candidate.id}
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
                          const targetOptions = derivedScenes;

                          return (
                            <div
                              key={`info-${index}-${hotspotIndex}`}
                              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_auto] items-center gap-1"
                            >
                              <input
                                className="min-w-0 rounded-md border border-black/10 bg-white px-2 py-1 text-xs"
                                placeholder="yaw"
                                value={hotspot.yaw}
                                onChange={(e) =>
                                  updateInfoHotspot(index, hotspotIndex, {
                                    yaw: e.target.value,
                                  })
                                }
                                aria-label="Info hotspot yaw"
                              />
                              <input
                                className="min-w-0 rounded-md border border-black/10 bg-white px-2 py-1 text-xs"
                                placeholder="pitch"
                                value={hotspot.pitch}
                                onChange={(e) =>
                                  updateInfoHotspot(index, hotspotIndex, {
                                    pitch: e.target.value,
                                  })
                                }
                                aria-label="Info hotspot pitch"
                              />
                              <input
                                className="min-w-0 rounded-md border border-black/10 bg-white px-2 py-1 text-xs"
                                placeholder="title"
                                value={hotspot.title}
                                onChange={(e) =>
                                  updateInfoHotspot(index, hotspotIndex, {
                                    title: e.target.value,
                                  })
                                }
                                aria-label="Info hotspot title"
                              />
                              <input
                                className="min-w-0 rounded-md border border-black/10 bg-white px-2 py-1 text-xs"
                                placeholder="text"
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
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-3">
        {/* <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-slate-700">
                Email
            </span>
            <input
                type="email"
                className="rounded-md border border-black/10 bg-white px-2 py-1.5 text-sm"
                // value={email}
                // onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
            />
            </label> */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
          onClick={onGenerate}
          disabled={Boolean(sceneNameError)}
        >
          Generate data.js
        </button>
        <div className="text-xs text-slate-600" aria-live="polite">
          {sceneNameError || copyState.message}
        </div>
      </div>
    </div>
  );
}
