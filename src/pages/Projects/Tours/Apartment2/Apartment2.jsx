import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { renderToStaticMarkup } from "react-dom/server";
import { FaLocationDot } from "react-icons/fa6";
import { IoInformationCircleOutline } from "react-icons/io5";
import bowser from "bowser";
import "../style.css";
import MarzipanoTopBar from "../components/MarzipanoTopBar";
import TourLoadSnackbar from "../components/TourLoadSnackbar";
import ViewControlButtons from "../components/ViewControlButtons";
import {
  buildTourAssetManifest,
  preloadTourAssetsWithProgress,
} from "../utils/tourAssetLoading";

// Generated from /playground
// Relative positions (0..1) over floorplan image.
export const floorplanScenePositions = [
  { id: "scene-1", x: 0.938, y: 0.4006578947368421 },
  { id: "scene-2", x: 0.5888157894736842, y: 0.28289473684210525 },
  { id: "scene-3", x: 0.776, y: 0.5796052631578947 },
  { id: "scene-4", x: 0.5, y: 0.5 },
];

export const data = {
  scenes: [
    {
      id: "scene-1",
      name: "scene1",
      imageUrl: "/public/projects/Apartment2/Apartment2_360_01.jpg", // original file: Apartment2_360_01.jpg
      equirectWidth: 4000,
      initialViewParameters: {
        pitch: 5,
        yaw: 295,
        fov: 100,
      },
      linkHotspots: [
        { yaw: -1.65732, pitch: -22.765205, target: "scene-2" },
        { yaw: -42.054088, pitch: -14.062712, target: "scene-3" },
      ],
      infoHotspots: [
      ],
    },
    {
      id: "scene-2",
      name: "scene2",
      imageUrl: "/public/projects/Apartment2/Apartment2_360_02.jpg", // original file: Apartment2_360_02.jpg
      equirectWidth: 4000,
      linkHotspots: [
        { yaw: 178.901774, pitch: -21.890689, target: "scene-1" },
        { yaw: -79.0674, pitch: -21.006124, target: "scene-3" },
        { yaw: -99.495114, pitch: -15.770656, target: "scene-4" },
      ],
      infoHotspots: [
      ],
    },
    {
      id: "scene-3",
      name: "scene3",
      imageUrl: "/public/projects/Apartment2/Apartment2_360_03.jpg", // original file: Apartment2_360_03.jpg
      equirectWidth: 4000,
      linkHotspots: [
        { yaw: 133.139627, pitch: -17.155637, target: "scene-1" },
        { yaw: 85.68115, pitch: -23.16039, target: "scene-2" },
        { yaw: -114.628321, pitch: -38.19572, target: "scene-4" },
      ],
      infoHotspots: [
      ],
    },
    {
      id: "scene-4",
      name: "scene4",
      imageUrl: "/public/projects/Apartment2/Apartment2_360_04.jpg", // original file: Apartment2_360_04.jpg
      equirectWidth: 4000,
      linkHotspots: [
        { yaw: 117.383696, pitch: -12.720225, target: "scene-1" },
        { yaw: 79.303294, pitch: -15.399052, target: "scene-2" },
        { yaw: 51.74327, pitch: -34.171095, target: "scene-3" },
      ],
      infoHotspots: [
      ],
    }
  ],
  name: "Apartment2",
  floorplanImageUrl: "/public/projects/Apartment2/Apartment2_360_top.jpg",
  settings: {
    mouseViewMode: "drag",
    autorotateEnabled: false,
    fullscreenButton: true,
    viewControlButtons: false,
  },
};
const Apartment2 = () => {
  const rootRef = useRef(null);
  const [topBarTarget, setTopBarTarget] = useState(null);
  const [resolvedAssetUrls, setResolvedAssetUrls] = useState(null);
  const [loadProgress, setLoadProgress] = useState({
    visible: false,
    loadedBytes: 0,
    totalBytes: 0,
    completedFiles: 0,
    totalFiles: 0,
    hasError: false,
  });
  const [viewControlsContext, setViewControlsContext] = useState({
    viewer: null,
    Marzipano: null,
  });

  const degToRad = (deg) => (deg * Math.PI) / 180;
  const hotspotPitchSign = -1;

  const assetUrls = useMemo(
    () => ({
      floorplan: new URL(
        "/projects/Apartment2/Apartment2_360_top.jpg",
        import.meta.url,
      ).href,
      close: new URL("../imgButtons/close.png", import.meta.url).href,
    }),
    [],
  );

  useEffect(() => {
    setResolvedAssetUrls(assetUrls);
  }, [assetUrls]);

  useEffect(() => {
    setTopBarTarget(document.getElementById("marzipanoTopBarSlot"));

    const root = rootRef.current;
    if (!root) {
      return undefined;
    }

    const body = document.body;
    const bodyClasses = [];
    if (data.scenes.length > 1) {
      bodyClasses.push("multiple-scenes");
    } else {
      bodyClasses.push("single-scene");
    }
    bodyClasses.forEach((className) => body.classList.add(className));
    body.classList.add("marzipano-navbar");

    const ensureLink = (href, id) => {
      const existing = document.querySelector(`link[data-marzipano="${id}"]`);
      if (existing) {
        return existing;
      }
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.dataset.marzipano = id;
      document.head.appendChild(link);
      return link;
    };

    const loadScriptOnce = (src, id) =>
      new Promise((resolve, reject) => {
        const existing = document.querySelector(
          `script[data-marzipano="${id}"]`,
        );
        if (existing) {
          if (existing.dataset.loaded === "true") {
            resolve();
          } else {
            existing.addEventListener("load", resolve, { once: true });
            existing.addEventListener("error", reject, { once: true });
          }
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.dataset.marzipano = id;
        script.addEventListener(
          "load",
          () => {
            script.dataset.loaded = "true";
            resolve();
          },
          { once: true },
        );
        script.addEventListener("error", reject, { once: true });
        document.head.appendChild(script);
      });

    ensureLink("https://www.marzipano.net/demos/common/reset.css", "reset");

    let disposed = false;
    let preloadAbortController = null;
    let revokePreloadedUrls = () => {};
    const infoModals = [];

    const assetManifest = buildTourAssetManifest(data, assetUrls);
    setLoadProgress({
      visible: assetManifest.totalFiles > 0,
      loadedBytes: 0,
      totalBytes: 0,
      completedFiles: 0,
      totalFiles: assetManifest.totalFiles,
      hasError: false,
    });

    const init = async () => {
      preloadAbortController = new AbortController();
      const preloadPromise = preloadTourAssetsWithProgress({
        urls: assetManifest.allUrls,
        signal: preloadAbortController.signal,
        onProgress: (progress) => {
          if (disposed) {
            return;
          }
          setLoadProgress({
            visible: true,
            loadedBytes: progress.loadedBytes,
            totalBytes: progress.totalBytes,
            completedFiles: progress.completedFiles,
            totalFiles: progress.totalFiles,
            hasError: progress.hasError,
          });
        },
      });

      try {
        await Promise.all([
          preloadPromise,
          loadScriptOnce("/build/marzipano.js", "marzipano"),
          loadScriptOnce(
            "https://www.marzipano.net/demos/common/screenfull.js",
            "screenfull",
          ),
        ]);
      } catch (error) {
        if (!disposed) {
          setLoadProgress((previousState) => ({
            ...previousState,
            visible: false,
            hasError: true,
          }));
        }
        return;
      }

      const preloadResult = await preloadPromise;
      revokePreloadedUrls = preloadResult.revokeObjectUrls;

      const resolvePreloadedUrl = (url) => preloadResult.urlMap.get(url) || url;

      if (!disposed) {
        setResolvedAssetUrls((currentAssetUrls) => {
          if (!currentAssetUrls) {
            return currentAssetUrls;
          }
          return {
            ...currentAssetUrls,
            floorplan: resolvePreloadedUrl(currentAssetUrls.floorplan),
          };
        });
        setLoadProgress((previousState) => ({
          ...previousState,
          loadedBytes: preloadResult.loadedBytes,
          totalBytes: preloadResult.totalBytes,
          completedFiles: preloadResult.completedFiles,
          totalFiles: preloadResult.totalFiles,
          hasError: preloadResult.hasError,
          visible: false,
        }));
      }

      if (disposed) {
        revokePreloadedUrls();
        return;
      }

      const Marzipano = window.Marzipano;
      const screenfull = window.screenfull;

      if (!Marzipano) {
        return;
      }

      const panoElement = root.querySelector("#pano");
      const sceneNameElement = document.querySelector("#titleBar .sceneName");
      const sceneListElement = document.querySelector("#sceneList");
      const sceneElements = document.querySelectorAll(".scene[data-id]");
      const sceneListToggleElement = document.querySelector("#sceneListToggle");
      const sceneListCloseElement = document.querySelector(
        '.scene-list-close[data-action="close-scene-list"]',
      );
      const autorotateToggleElement =
        document.querySelector("#autorotateToggle");
      const fullscreenToggleElement =
        document.querySelector("#fullscreenToggle");

      if (!panoElement) {
        return;
      }

      if (window.matchMedia) {
        const mql = window.matchMedia(
          "(max-width: 500px), (max-height: 500px)",
        );
        const setMode = () => {
          if (mql.matches) {
            document.body.classList.remove("desktop");
            document.body.classList.add("mobile");
          } else {
            document.body.classList.remove("mobile");
            document.body.classList.add("desktop");
          }
        };
        setMode();
        mql.addListener(setMode);
      } else {
        document.body.classList.add("desktop");
      }

      document.body.classList.add("no-touch");
      window.addEventListener("touchstart", () => {
        document.body.classList.remove("no-touch");
        document.body.classList.add("touch");
      });

      if (bowser.msie && parseFloat(bowser.version) < 11) {
        document.body.classList.add("tooltip-fallback");
      }

      const viewerOpts = {
        controls: {
          mouseViewMode: data.settings.mouseViewMode,
        },
      };

      const viewer = new Marzipano.Viewer(panoElement, viewerOpts);
      setViewControlsContext({ viewer, Marzipano });

      const scenes = data.scenes.map((sceneData) => {
        const sceneImageUrl = resolvePreloadedUrl(sceneData.imageUrl);
        const source = Marzipano.ImageUrlSource.fromString(sceneImageUrl);
        const geometry = new Marzipano.EquirectGeometry([
          { width: sceneData.equirectWidth },
        ]);

        const limiter = Marzipano.RectilinearView.limit.traditional(
          10000,
          (120 * Math.PI) / 180,
          (120 * Math.PI) / 180,
        );
        const initialViewParameters = sceneData.initialViewParameters || {};
        const view = new Marzipano.RectilinearView(
          {
            yaw: degToRad(initialViewParameters.yaw ?? 0),
            pitch: degToRad(initialViewParameters.pitch ?? 0),
            fov: degToRad(initialViewParameters.fov ?? 110),
          },
          limiter,
        );

        const scene = viewer.createScene({
          source,
          geometry,
          view,
          pinFirstLevel: true,
        });

        sceneData.linkHotspots.forEach((hotspot) => {
          const element = createLinkHotspotElement(hotspot);
          scene.hotspotContainer().createHotspot(element, {
            yaw: degToRad(hotspot.yaw),
            pitch: degToRad(hotspot.pitch * hotspotPitchSign),
          });
        });

        sceneData.infoHotspots.forEach((hotspot) => {
          const element = createInfoHotspotElement(hotspot);
          scene.hotspotContainer().createHotspot(element, {
            yaw: degToRad(hotspot.yaw),
            pitch: degToRad(hotspot.pitch * hotspotPitchSign),
          });
        });

        return {
          data: sceneData,
          scene,
          view,
        };
      });

      const autorotate = Marzipano.autorotate({
        yawSpeed: 0.03,
        targetPitch: 0,
        targetFov: Math.PI / 2,
      });
      let autorotateEnabled = Boolean(data.settings.autorotateEnabled);

      autorotateToggleElement?.addEventListener("click", toggleAutorotate);

      if (data.settings.fullscreenButton) {
        document.body.classList.add("fullscreen-enabled");
        if (screenfull?.enabled) {
          fullscreenToggleElement?.addEventListener("click", () => {
            screenfull.toggle();
          });
          screenfull.on("change", () => {
            if (screenfull.isFullscreen) {
              fullscreenToggleElement?.classList.add("enabled");
            } else {
              fullscreenToggleElement?.classList.remove("enabled");
            }
          });
        } else {
          document.body.classList.add("fullscreen-unavailable");
          fullscreenToggleElement?.setAttribute("disabled", "true");
          fullscreenToggleElement?.setAttribute("aria-disabled", "true");
        }
      } else {
        document.body.classList.add("fullscreen-disabled");
      }

      if (sceneListToggleElement) {
        sceneListToggleElement.onclick = toggleSceneList;
      }

      if (sceneListCloseElement && sceneListToggleElement) {
        sceneListCloseElement.onclick = () => {
          sceneListToggleElement.click();
        };
      }

      if (!document.body.classList.contains("mobile")) {
        showSceneList();
      } else {
        hideSceneList();
      }

      scenes.forEach((scene) => {
        const elements = document.querySelectorAll(
          `.scene[data-id="${scene.data.id}"]`,
        );
        elements.forEach((el) => {
          el.addEventListener("click", () => {
            switchScene(scene);
            if (document.body.classList.contains("mobile")) {
              hideSceneList();
            }
          });
        });
      });

      function sanitize(value) {
        return value
          .replace("&", "&amp;")
          .replace("<", "&lt;")
          .replace(">", "&gt;");
      }

      const getInitialViewParameters = (scene) => {
        const params = scene.data.initialViewParameters || {};
        return {
          yaw: degToRad(params.yaw ?? 0),
          pitch: degToRad(params.pitch ?? 0),
          fov: degToRad(params.fov ?? 110),
        };
      };

      let activeScene = null;

      function switchScene(scene) {
        stopAutorotate();
        const nextParameters = activeScene
          ? activeScene.view.parameters()
          : getInitialViewParameters(scene);
        scene.view.setParameters(nextParameters);
        scene.scene.switchTo();
        activeScene = scene;
        startAutorotate();
        updateSceneName(scene);
        updateSceneList(scene);
      }

      function updateSceneName(scene) {
        if (sceneNameElement) {
          sceneNameElement.innerHTML = sanitize(scene.data.name);
        }
      }

      function updateSceneList(scene) {
        for (let i = 0; i < sceneElements.length; i += 1) {
          const el = sceneElements[i];
          if (el.getAttribute("data-id") === scene.data.id) {
            el.classList.add("current");
          } else {
            el.classList.remove("current");
          }
        }
      }

      function showSceneList() {
        sceneListElement?.classList.add("enabled");
        sceneListToggleElement?.classList.add("enabled");
      }

      function hideSceneList() {
        sceneListElement?.classList.remove("enabled");
        sceneListToggleElement?.classList.remove("enabled");
      }

      function toggleSceneList() {
        sceneListElement?.classList.toggle("enabled");
        sceneListToggleElement?.classList.toggle("enabled");
      }

      function startAutorotate() {
        if (!autorotateEnabled) {
          return;
        }
        viewer.startMovement(autorotate);
        viewer.setIdleMovement(3000, autorotate);
      }

      function stopAutorotate() {
        viewer.stopMovement();
        viewer.setIdleMovement(Infinity);
      }

      function toggleAutorotate() {
        autorotateEnabled = !autorotateEnabled;
        if (autorotateEnabled) {
          autorotateToggleElement?.classList.add("enabled");
          startAutorotate();
        } else {
          autorotateToggleElement?.classList.remove("enabled");
          stopAutorotate();
        }
      }

      function createLinkHotspotElement(hotspot) {
        const wrapper = document.createElement("div");
        wrapper.classList.add("hotspot", "link-hotspot");

        const icon = document.createElement("div");
        icon.classList.add("link-hotspot-icon");
        icon.innerHTML = renderToStaticMarkup(
          <FaLocationDot aria-hidden="true" focusable="false" />,
        );

        const rotation = hotspot.rotation ?? 0;
        icon.style.setProperty("--hotspot-rotation", `${rotation}rad`);

        wrapper.addEventListener("click", () => {
          const targetScene = findSceneById(hotspot.target);
          if (!targetScene) {
            return;
          }
          switchScene(targetScene);
        });

        stopTouchAndScrollEventPropagation(wrapper);

        const tooltip = document.createElement("div");
        tooltip.classList.add("hotspot-tooltip", "link-hotspot-tooltip");
        tooltip.innerHTML =
          findSceneDataById(hotspot.target)?.name || String(hotspot.target);

        wrapper.appendChild(icon);
        wrapper.appendChild(tooltip);

        return wrapper;
      }

      function createInfoHotspotElement(hotspot) {
        const wrapper = document.createElement("div");
        wrapper.classList.add("hotspot", "info-hotspot");

        const header = document.createElement("div");
        header.classList.add("info-hotspot-header");

        const iconWrapper = document.createElement("div");
        iconWrapper.classList.add("info-hotspot-icon-wrapper");
        const icon = document.createElement("div");
        icon.classList.add("info-hotspot-icon");
        icon.innerHTML = renderToStaticMarkup(
          <IoInformationCircleOutline
            aria-hidden="true"
            focusable="false"
            style={{ width: "100%", height: "100%" }}
          />,
        );
        iconWrapper.appendChild(icon);

        const titleWrapper = document.createElement("div");
        titleWrapper.classList.add("info-hotspot-title-wrapper");
        const title = document.createElement("div");
        title.classList.add("info-hotspot-title");
        title.innerHTML = hotspot.title;
        titleWrapper.appendChild(title);

        const closeWrapper = document.createElement("div");
        closeWrapper.classList.add("info-hotspot-close-wrapper");
        const closeIcon = document.createElement("img");
        closeIcon.src = assetUrls.close;
        closeIcon.classList.add("info-hotspot-close-icon");
        closeWrapper.appendChild(closeIcon);

        header.appendChild(iconWrapper);
        header.appendChild(titleWrapper);
        header.appendChild(closeWrapper);

        const text = document.createElement("div");
        text.classList.add("info-hotspot-text");
        text.innerHTML = hotspot.text;

        wrapper.appendChild(header);
        wrapper.appendChild(text);

        const modal = document.createElement("div");
        modal.innerHTML = wrapper.innerHTML;
        modal.classList.add("info-hotspot-modal");
        document.body.appendChild(modal);
        infoModals.push(modal);

        const toggle = () => {
          wrapper.classList.toggle("visible");
          modal.classList.toggle("visible");
        };

        wrapper
          .querySelector(".info-hotspot-header")
          ?.addEventListener("click", toggle);
        modal
          .querySelector(".info-hotspot-close-wrapper")
          ?.addEventListener("click", toggle);

        stopTouchAndScrollEventPropagation(wrapper);

        return wrapper;
      }

      function stopTouchAndScrollEventPropagation(element) {
        const eventList = [
          "touchstart",
          "touchmove",
          "touchend",
          "touchcancel",
          "pointerdown",
          "pointermove",
          "pointerup",
          "pointercancel",
          "wheel",
        ];
        for (let i = 0; i < eventList.length; i += 1) {
          element.addEventListener(eventList[i], (event) => {
            event.stopPropagation();
          });
        }
      }

      function findSceneById(id) {
        for (let i = 0; i < scenes.length; i += 1) {
          if (scenes[i].data.id === id) {
            return scenes[i];
          }
        }
        return null;
      }

      function findSceneDataById(id) {
        for (let i = 0; i < data.scenes.length; i += 1) {
          if (data.scenes[i].id === id) {
            return data.scenes[i];
          }
        }
        return null;
      }

      if (autorotateEnabled) {
        autorotateToggleElement?.classList.add("enabled");
      } else {
        autorotateToggleElement?.classList.remove("enabled");
        stopAutorotate();
      }

      switchScene(scenes[0]);
    };

    init();

    return () => {
      disposed = true;
      preloadAbortController?.abort();
      revokePreloadedUrls();
      setViewControlsContext({ viewer: null, Marzipano: null });
      const toggleEl = document.querySelector("#sceneListToggle");
      const closeEl = document.querySelector(
        '.scene-list-close[data-action="close-scene-list"]',
      );
      if (toggleEl) {
        toggleEl.onclick = null;
      }
      if (closeEl) {
        closeEl.onclick = null;
      }
      bodyClasses.forEach((className) => body.classList.remove(className));
      body.classList.remove("marzipano-navbar");
      infoModals.forEach((modal) => modal.remove());
    };
  }, [assetUrls]);

  return (
    <div ref={rootRef} className="sample-ai-root">
      <TourLoadSnackbar
        visible={loadProgress.visible}
        loadedBytes={loadProgress.loadedBytes}
        totalBytes={loadProgress.totalBytes}
        completedFiles={loadProgress.completedFiles}
        totalFiles={loadProgress.totalFiles}
        hasError={loadProgress.hasError}
      />
      {topBarTarget &&
        createPortal(
          <MarzipanoTopBar
            scenes={data.scenes}
            assetUrls={resolvedAssetUrls || assetUrls}
            floorplanPositions={floorplanScenePositions}
          />,
          topBarTarget,
        )}
      <div id="pano" />
      <ViewControlButtons
        rootRef={rootRef}
        viewer={viewControlsContext.viewer}
        Marzipano={viewControlsContext.Marzipano}
        enabled={data.settings.viewControlButtons}
      />
    </div>
  );
};

export default Apartment2;
