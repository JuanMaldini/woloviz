import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { renderToStaticMarkup } from "react-dom/server";
import { FaLocationDot } from "react-icons/fa6";
import {
  IoAdd,
  IoChevronDown,
  IoChevronForward,
  IoChevronUp,
  IoRemove,
} from "react-icons/io5";
import { IoInformationCircleOutline } from "react-icons/io5";
import bowser from "bowser";
import "../style.css";
import MarzipanoTopBar from "../components/MarzipanoTopBar";
import Form from "./Form";
import TourInfoModal from "./TourInfoModal";
import { data, floorplanScenePositions } from "./data";

const PRESERVE_CURRENT_VIEW_STORAGE_KEY = "playground:preserve-current-view";
const RUNTIME_VIEW_STATE_STORAGE_KEY = "playground:current-view-state:v1";
const AUTOROTATE_ENABLED_STORAGE_KEY = "playground:autorotate-enabled";
const VIEW_CONTROL_BUTTONS_STORAGE_KEY = "playground:view-control-buttons";

const Playground = () => {
  const rootRef = useRef(null);
  const [topBarTarget, setTopBarTarget] = useState(null);
  const [isTourInfoModalOpen, setIsTourInfoModalOpen] = useState(false);
  const [runtimeData, setRuntimeData] = useState(data);
  const [runtimeFloorplanPositions, setRuntimeFloorplanPositions] = useState(
    floorplanScenePositions,
  );

  const activeData = runtimeData ?? data;
  const activeFloorplanPositions =
    runtimeFloorplanPositions ?? floorplanScenePositions;

  const degToRad = (deg) => (deg * Math.PI) / 180;
  const hotspotPitchSign = -1;

  const assetUrls = useMemo(() => {
    const floorplanSource = String(activeData?.floorplanImageUrl ?? "").trim();
    const floorplan = floorplanSource
      ? floorplanSource.startsWith("blob:")
        ? floorplanSource
        : new URL(floorplanSource, import.meta.url).href
      : "";

    return {
      floorplan,
    };
  }, [activeData?.floorplanImageUrl]);

  useEffect(() => {
    setTopBarTarget(document.getElementById("marzipanoTopBarSlot"));

    const root = rootRef.current;
    if (!root) {
      return undefined;
    }

    const body = document.body;
    body.classList.add("playground-floorplan-contained");

    const readBooleanFromSession = (key, fallback) => {
      if (typeof window === "undefined") {
        return fallback;
      }
      try {
        const saved = window.sessionStorage.getItem(key);
        if (saved === "1" || saved === "0") {
          return saved === "1";
        }
      } catch {}
      return fallback;
    };

    const initialAutorotateEnabled = readBooleanFromSession(
      AUTOROTATE_ENABLED_STORAGE_KEY,
      Boolean(activeData.settings.autorotateEnabled),
    );
    const initialViewControlButtonsEnabled = readBooleanFromSession(
      VIEW_CONTROL_BUTTONS_STORAGE_KEY,
      Boolean(activeData.settings.viewControlButtons),
    );

    const updateFloorplanBounds = () => {
      const rect = root.getBoundingClientRect();
      body.style.setProperty("--playground-floorplan-top", `${rect.top}px`);
      body.style.setProperty("--playground-floorplan-left", `${rect.left}px`);
      body.style.setProperty("--playground-floorplan-width", `${rect.width}px`);
      body.style.setProperty(
        "--playground-floorplan-height",
        `${rect.height}px`,
      );
    };

    updateFloorplanBounds();

    const resizeObserver = new ResizeObserver(() => {
      updateFloorplanBounds();
    });
    resizeObserver.observe(root);
    window.addEventListener("resize", updateFloorplanBounds);
    window.addEventListener("scroll", updateFloorplanBounds, { passive: true });

    const bodyClasses = [];
    const shouldShowSceneMenu =
      activeData.scenes.length > 1 || Boolean(activeData.floorplanImageUrl);
    if (shouldShowSceneMenu) {
      bodyClasses.push("multiple-scenes");
    } else {
      bodyClasses.push("single-scene");
    }
    if (initialViewControlButtonsEnabled) {
      bodyClasses.push("view-control-buttons");
    }
    bodyClasses.forEach((className) => body.classList.add(className));
    body.classList.add("marzipano-navbar");

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

    const resetLink = document.querySelector('link[data-marzipano="reset"]');
    if (resetLink?.parentNode) {
      resetLink.parentNode.removeChild(resetLink);
    }

    let disposed = false;
    const infoModals = [];
    let infoHotspotPickRequest = null;
    let linkHotspotPickRequest = null;
    let onInfoPickStart = null;
    let onLinkPickStart = null;
    let onPanoClickForInfoPick = null;
    let onPanoClickForLinkPick = null;
    let onPanoPointerUpForViewSave = null;
    let onPanoWheelForViewSave = null;
    let onPreserveCurrentViewChanged = null;
    let onViewerSettingsChanged = null;
    let viewerInstance = null;
    const viewChangeListeners = [];

    const init = async () => {
      try {
        await loadScriptOnce("/build/marzipano.js", "marzipano");
      } catch (error) {
        return;
      }

      try {
        await loadScriptOnce(
          "https://www.marzipano.net/demos/common/screenfull.js",
          "screenfull",
        );
      } catch (error) {
        console.warn(
          "screenfull script could not be loaded; fullscreen toggle will be disabled",
          error,
        );
      }

      if (disposed) {
        return;
      }

      const Marzipano = window.Marzipano;
      const screenfull = window.screenfull;
      let preserveCurrentViewEnabled = false;

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

      const readPreserveCurrentViewPreference = () => {
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
      };

      const clearRuntimeViewState = () => {
        if (typeof window === "undefined") {
          return;
        }
        try {
          window.sessionStorage.removeItem(RUNTIME_VIEW_STATE_STORAGE_KEY);
        } catch {}
      };

      const saveRuntimeViewState = (scene, parameters) => {
        preserveCurrentViewEnabled = readPreserveCurrentViewPreference();
        if (!preserveCurrentViewEnabled || !scene?.data?.id) {
          return;
        }

        const fromArgs = parameters ?? {};
        const fromView = scene.view?.parameters?.() ?? {};
        const fromInitial = {
          yaw: degToRad(scene.data?.initialViewParameters?.yaw ?? 0),
          pitch: degToRad(scene.data?.initialViewParameters?.pitch ?? 0),
          fov: degToRad(scene.data?.initialViewParameters?.fov ?? 110),
        };

        const yawRad = Number.isFinite(fromArgs.yaw)
          ? fromArgs.yaw
          : Number.isFinite(fromView.yaw)
            ? fromView.yaw
            : fromInitial.yaw;
        const pitchRad = Number.isFinite(fromArgs.pitch)
          ? fromArgs.pitch
          : Number.isFinite(fromView.pitch)
            ? fromView.pitch
            : fromInitial.pitch;
        const fovRad = Number.isFinite(fromArgs.fov)
          ? fromArgs.fov
          : Number.isFinite(fromView.fov)
            ? fromView.fov
            : fromInitial.fov;

        const yaw = Number(((yawRad * 180) / Math.PI).toFixed(6));
        const pitch = Number(((pitchRad * 180) / Math.PI).toFixed(6));
        const fov = Number(((fovRad * 180) / Math.PI).toFixed(6));

        if (![yaw, pitch, fov].every((value) => Number.isFinite(value))) {
          return;
        }

        const snapshot = {
          version: 1,
          sceneId: String(scene.data.id),
          yaw,
          pitch,
          fov,
          updatedAt: Date.now(),
        };

        try {
          window.sessionStorage.setItem(
            RUNTIME_VIEW_STATE_STORAGE_KEY,
            JSON.stringify(snapshot),
          );
        } catch {}
      };

      const readRuntimeViewState = () => {
        preserveCurrentViewEnabled = readPreserveCurrentViewPreference();
        if (!preserveCurrentViewEnabled) {
          return null;
        }

        try {
          const raw = window.sessionStorage.getItem(
            RUNTIME_VIEW_STATE_STORAGE_KEY,
          );
          if (!raw) {
            return null;
          }
          const parsed = JSON.parse(raw);
          const sceneId = String(parsed?.sceneId ?? "").trim();
          const yaw = Number(parsed?.yaw);
          const pitch = Number(parsed?.pitch);
          const fov = Number(parsed?.fov);

          if (
            !sceneId ||
            ![yaw, pitch, fov].every((value) => Number.isFinite(value))
          ) {
            clearRuntimeViewState();
            return null;
          }

          return {
            sceneId,
            yaw,
            pitch,
            fov,
          };
        } catch {
          clearRuntimeViewState();
          return null;
        }
      };

      preserveCurrentViewEnabled = readPreserveCurrentViewPreference();

      onPreserveCurrentViewChanged = (event) => {
        const enabled = Boolean(event?.detail?.enabled);
        preserveCurrentViewEnabled = enabled;
        if (!enabled) {
          clearRuntimeViewState();
        }
      };

      window.addEventListener(
        "playground:preserve-current-view-changed",
        onPreserveCurrentViewChanged,
      );

      onPanoPointerUpForViewSave = () => {
        if (activeScene) {
          saveRuntimeViewState(activeScene);
        }
      };
      onPanoWheelForViewSave = () => {
        if (activeScene) {
          saveRuntimeViewState(activeScene);
        }
      };

      panoElement.addEventListener(
        "pointerup",
        onPanoPointerUpForViewSave,
        true,
      );
      panoElement.addEventListener("wheel", onPanoWheelForViewSave, {
        capture: true,
        passive: true,
      });

      const dispatchInfoPickResult = (detail) => {
        window.dispatchEvent(
          new CustomEvent("playground:infohotspot-pick-result", { detail }),
        );
      };

      const dispatchLinkPickResult = (detail) => {
        window.dispatchEvent(
          new CustomEvent("playground:linkhotspot-pick-result", { detail }),
        );
      };

      const setPickCursor = () => {
        panoElement.style.cursor =
          infoHotspotPickRequest || linkHotspotPickRequest ? "crosshair" : "";
      };

      onInfoPickStart = (event) => {
        const detail = event?.detail ?? {};
        const sceneIndex = Number(detail.sceneIndex);
        const hotspotIndex = Number(detail.hotspotIndex);
        if (!Number.isInteger(sceneIndex) || !Number.isInteger(hotspotIndex)) {
          return;
        }
        infoHotspotPickRequest = {
          sceneIndex,
          hotspotIndex,
        };
        linkHotspotPickRequest = null;
        setPickCursor();
      };

      onLinkPickStart = (event) => {
        const detail = event?.detail ?? {};
        const sceneIndex = Number(detail.sceneIndex);
        const hotspotIndex = Number(detail.hotspotIndex);
        if (!Number.isInteger(sceneIndex) || !Number.isInteger(hotspotIndex)) {
          return;
        }
        linkHotspotPickRequest = {
          sceneIndex,
          hotspotIndex,
        };
        infoHotspotPickRequest = null;
        setPickCursor();
      };

      onPanoClickForInfoPick = (event) => {
        if (!infoHotspotPickRequest) {
          return;
        }

        const blockedTarget = event.target?.closest?.(
          ".hotspot, .info-hotspot-modal, #titleBar, #sceneList, .viewControlButton",
        );

        if (blockedTarget) {
          dispatchInfoPickResult({
            ...infoHotspotPickRequest,
            status: "fail",
          });
          return;
        }

        const rect = panoElement.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0 || !activeScene?.view) {
          dispatchInfoPickResult({
            ...infoHotspotPickRequest,
            status: "fail",
          });
          return;
        }

        const viewCoords = activeScene.view.screenToCoordinates({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });

        if (
          !viewCoords ||
          !Number.isFinite(viewCoords.yaw) ||
          !Number.isFinite(viewCoords.pitch)
        ) {
          dispatchInfoPickResult({
            ...infoHotspotPickRequest,
            status: "fail",
          });
          return;
        }

        const result = {
          ...infoHotspotPickRequest,
          status: "ok",
          yaw: Number(((viewCoords.yaw * 180) / Math.PI).toFixed(6)),
          pitch: Number(((-viewCoords.pitch * 180) / Math.PI).toFixed(6)),
        };

        infoHotspotPickRequest = null;
        setPickCursor();
        dispatchInfoPickResult(result);
      };

      onPanoClickForLinkPick = (event) => {
        if (!linkHotspotPickRequest) {
          return;
        }

        const blockedTarget = event.target?.closest?.(
          ".hotspot, .info-hotspot-modal, #titleBar, #sceneList, .viewControlButton",
        );

        if (blockedTarget) {
          dispatchLinkPickResult({
            ...linkHotspotPickRequest,
            status: "fail",
          });
          return;
        }

        const rect = panoElement.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0 || !activeScene?.view) {
          dispatchLinkPickResult({
            ...linkHotspotPickRequest,
            status: "fail",
          });
          return;
        }

        const viewCoords = activeScene.view.screenToCoordinates({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });

        if (
          !viewCoords ||
          !Number.isFinite(viewCoords.yaw) ||
          !Number.isFinite(viewCoords.pitch)
        ) {
          dispatchLinkPickResult({
            ...linkHotspotPickRequest,
            status: "fail",
          });
          return;
        }

        const result = {
          ...linkHotspotPickRequest,
          status: "ok",
          yaw: Number(((viewCoords.yaw * 180) / Math.PI).toFixed(6)),
          pitch: Number(((-viewCoords.pitch * 180) / Math.PI).toFixed(6)),
        };

        linkHotspotPickRequest = null;
        setPickCursor();
        dispatchLinkPickResult(result);
      };

      window.addEventListener(
        "playground:infohotspot-pick-start",
        onInfoPickStart,
      );
      window.addEventListener(
        "playground:linkhotspot-pick-start",
        onLinkPickStart,
      );
      panoElement.addEventListener("click", onPanoClickForInfoPick, true);
      panoElement.addEventListener("click", onPanoClickForLinkPick, true);

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
          mouseViewMode: activeData.settings.mouseViewMode,
        },
      };

      const viewer = new Marzipano.Viewer(panoElement, viewerOpts);
      viewerInstance = viewer;
      let activeScene = null;

      const scenes = activeData.scenes.map((sceneData) => {
        const source = Marzipano.ImageUrlSource.fromString(sceneData.imageUrl);
        const geometry = new Marzipano.EquirectGeometry([
          { width: sceneData.equirectWidth || 4000 },
        ]);

        const limiter = Marzipano.RectilinearView.limit.traditional(
          4000,
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

        const onViewChange = () => {
          if (activeScene === scene) {
            saveRuntimeViewState(scene);
          }
        };
        view.addEventListener("change", onViewChange);
        viewChangeListeners.push({ view, handler: onViewChange });

        sceneData.linkHotspots.forEach((hotspot, hotspotIndex) => {
          const element = createLinkHotspotElement(hotspot);
          const hotspotHandle = scene
            .hotspotContainer()
            .createHotspot(element, {
              yaw: degToRad(hotspot.yaw),
              pitch: degToRad(hotspot.pitch * hotspotPitchSign),
            });
          attachLinkHotspotDrag({
            wrapper: element,
            hotspotHandle,
            sceneView: view,
            sceneId: sceneData.id,
            hotspotIndex,
          });
        });

        sceneData.infoHotspots.forEach((hotspot, hotspotIndex) => {
          const element = createInfoHotspotElement(hotspot);
          const hotspotHandle = scene
            .hotspotContainer()
            .createHotspot(element, {
              yaw: degToRad(hotspot.yaw),
              pitch: degToRad(hotspot.pitch * hotspotPitchSign),
            });
          attachInfoHotspotDrag({
            wrapper: element,
            hotspotHandle,
            sceneView: view,
            sceneId: sceneData.id,
            hotspotIndex,
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
      let autorotateEnabled = initialAutorotateEnabled;

      autorotateToggleElement?.addEventListener("click", toggleAutorotate);

      if (activeData.settings.fullscreenButton) {
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

      if (!document.body.classList.contains("mobile")) {
        showSceneList();
      } else {
        hideSceneList();
      }

      if (sceneListCloseElement && sceneListToggleElement) {
        sceneListCloseElement.onclick = () => {
          sceneListToggleElement.click();
        };
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

      const viewUpElement = root.querySelector("#viewUp");
      const viewDownElement = root.querySelector("#viewDown");
      const viewLeftElement = root.querySelector("#viewLeft");
      const viewRightElement = root.querySelector("#viewRight");
      const viewInElement = root.querySelector("#viewIn");
      const viewOutElement = root.querySelector("#viewOut");

      const applyViewControlButtonsVisibility = (enabled) => {
        [
          viewUpElement,
          viewDownElement,
          viewLeftElement,
          viewRightElement,
          viewInElement,
          viewOutElement,
        ].forEach((el) => {
          if (el) {
            el.style.display = enabled ? "" : "none";
          }
        });

        if (enabled) {
          body.classList.add("view-control-buttons");
        } else {
          body.classList.remove("view-control-buttons");
        }
      };

      applyViewControlButtonsVisibility(initialViewControlButtonsEnabled);

      const velocity = 0.7;
      const friction = 3;

      const controls = viewer.controls();
      if (viewUpElement) {
        controls.registerMethod(
          "upElement",
          new Marzipano.ElementPressControlMethod(
            viewUpElement,
            "y",
            -velocity,
            friction,
          ),
          true,
        );
      }
      if (viewDownElement) {
        controls.registerMethod(
          "downElement",
          new Marzipano.ElementPressControlMethod(
            viewDownElement,
            "y",
            velocity,
            friction,
          ),
          true,
        );
      }
      if (viewLeftElement) {
        controls.registerMethod(
          "leftElement",
          new Marzipano.ElementPressControlMethod(
            viewLeftElement,
            "x",
            -velocity,
            friction,
          ),
          true,
        );
      }
      if (viewRightElement) {
        controls.registerMethod(
          "rightElement",
          new Marzipano.ElementPressControlMethod(
            viewRightElement,
            "x",
            velocity,
            friction,
          ),
          true,
        );
      }
      if (viewInElement) {
        controls.registerMethod(
          "inElement",
          new Marzipano.ElementPressControlMethod(
            viewInElement,
            "zoom",
            -velocity,
            friction,
          ),
          true,
        );
      }
      if (viewOutElement) {
        controls.registerMethod(
          "outElement",
          new Marzipano.ElementPressControlMethod(
            viewOutElement,
            "zoom",
            velocity,
            friction,
          ),
          true,
        );
      }

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

      function switchScene(scene, forcedParameters = null) {
        if (!scene) {
          return;
        }
        stopAutorotate();
        const nextParameters =
          forcedParameters ||
          (activeScene
            ? activeScene.view.parameters()
            : getInitialViewParameters(scene));
        scene.view.setParameters(nextParameters);
        scene.scene.switchTo();
        activeScene = scene;
        saveRuntimeViewState(scene, nextParameters);
        startAutorotate();
        updateSceneName(scene);
        updateSceneList(scene);
        window.dispatchEvent(
          new CustomEvent("playground:active-scene-changed", {
            detail: {
              sceneId: String(scene.data?.id ?? ""),
            },
          }),
        );
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

      onViewerSettingsChanged = (event) => {
        const detail = event?.detail ?? {};

        if (typeof detail.autorotateEnabled === "boolean") {
          autorotateEnabled = detail.autorotateEnabled;
          if (autorotateEnabled) {
            autorotateToggleElement?.classList.add("enabled");
            startAutorotate();
          } else {
            autorotateToggleElement?.classList.remove("enabled");
            stopAutorotate();
          }
        }

        if (typeof detail.viewControlButtons === "boolean") {
          applyViewControlButtonsVisibility(detail.viewControlButtons);
        }
      };

      window.addEventListener(
        "playground:viewer-settings-changed",
        onViewerSettingsChanged,
      );

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
        const targetSceneData = findSceneDataById(hotspot.target);
        tooltip.innerHTML = sanitize(
          targetSceneData?.name || String(hotspot.target || "Unknown scene"),
        );

        wrapper.appendChild(icon);
        wrapper.appendChild(tooltip);

        return wrapper;
      }

      function attachLinkHotspotDrag({
        wrapper,
        hotspotHandle,
        sceneView,
        sceneId,
        hotspotIndex,
      }) {
        const dragHandle = wrapper.querySelector(".link-hotspot-icon");
        if (!dragHandle) {
          return;
        }

        dragHandle.style.cursor = "grab";
        dragHandle.style.touchAction = "none";

        const dragState = {
          active: false,
          pointerId: null,
          startClientX: 0,
          startClientY: 0,
          hasDragged: false,
          suppressClick: false,
        };
        const DRAG_START_DISTANCE_PX = 12;

        const updateFromEvent = (event, shouldCommit) => {
          const rect = panoElement.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) {
            return false;
          }

          const viewCoords = sceneView.screenToCoordinates({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });

          if (
            !viewCoords ||
            !Number.isFinite(viewCoords.yaw) ||
            !Number.isFinite(viewCoords.pitch)
          ) {
            return false;
          }

          hotspotHandle.setPosition({
            yaw: viewCoords.yaw,
            pitch: viewCoords.pitch,
          });

          if (shouldCommit) {
            window.dispatchEvent(
              new CustomEvent("playground:linkhotspot-position-commit", {
                detail: {
                  sceneId,
                  hotspotIndex,
                  yaw: Number(((viewCoords.yaw * 180) / Math.PI).toFixed(6)),
                  pitch: Number(
                    ((-viewCoords.pitch * 180) / Math.PI).toFixed(6),
                  ),
                },
              }),
            );
          }

          return true;
        };

        const endDrag = () => {
          if (!dragState.active) {
            return;
          }
          dragState.active = false;
          dragState.pointerId = null;
          dragHandle.style.cursor = "grab";
        };

        dragHandle.addEventListener("pointerdown", (event) => {
          if (event.button !== 0) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          dragState.active = true;
          dragState.pointerId = event.pointerId;
          dragState.startClientX = event.clientX;
          dragState.startClientY = event.clientY;
          dragState.hasDragged = false;
          dragState.suppressClick = false;
          dragHandle.style.cursor = "grabbing";
          dragHandle.setPointerCapture?.(event.pointerId);
        });

        dragHandle.addEventListener("pointermove", (event) => {
          if (!dragState.active || event.pointerId !== dragState.pointerId) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();

          if (!dragState.hasDragged) {
            const movedX = Math.abs(event.clientX - dragState.startClientX);
            const movedY = Math.abs(event.clientY - dragState.startClientY);
            if (
              movedX < DRAG_START_DISTANCE_PX &&
              movedY < DRAG_START_DISTANCE_PX
            ) {
              return;
            }
            dragState.hasDragged = true;
          }

          dragState.suppressClick = true;
          updateFromEvent(event, false);
        });

        dragHandle.addEventListener("pointerup", (event) => {
          if (!dragState.active || event.pointerId !== dragState.pointerId) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          if (dragState.hasDragged) {
            updateFromEvent(event, true);
          }
          if (dragHandle.hasPointerCapture?.(event.pointerId)) {
            dragHandle.releasePointerCapture(event.pointerId);
          }
          endDrag();
        });

        dragHandle.addEventListener("pointercancel", () => {
          endDrag();
        });

        dragHandle.addEventListener("click", (event) => {
          if (!dragState.suppressClick) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          dragState.suppressClick = false;
        });
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
        const closeIcon = document.createElement("span");
        closeIcon.classList.add("info-hotspot-close-icon");
        closeIcon.textContent = "×";
        closeIcon.setAttribute("aria-hidden", "true");
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

      function attachInfoHotspotDrag({
        wrapper,
        hotspotHandle,
        sceneView,
        sceneId,
        hotspotIndex,
      }) {
        const dragHandle = wrapper.querySelector(".info-hotspot-icon-wrapper");
        if (!dragHandle) {
          return;
        }

        dragHandle.style.cursor = "grab";
        dragHandle.style.touchAction = "none";

        const dragState = {
          active: false,
          pointerId: null,
          startClientX: 0,
          startClientY: 0,
          hasDragged: false,
          suppressClick: false,
        };
        const DRAG_START_DISTANCE_PX = 12;

        const updateFromEvent = (event, shouldCommit) => {
          const rect = panoElement.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) {
            return false;
          }

          const viewCoords = sceneView.screenToCoordinates({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });

          if (
            !viewCoords ||
            !Number.isFinite(viewCoords.yaw) ||
            !Number.isFinite(viewCoords.pitch)
          ) {
            return false;
          }

          hotspotHandle.setPosition({
            yaw: viewCoords.yaw,
            pitch: viewCoords.pitch,
          });

          if (shouldCommit) {
            window.dispatchEvent(
              new CustomEvent("playground:infohotspot-position-commit", {
                detail: {
                  sceneId,
                  hotspotIndex,
                  yaw: Number(((viewCoords.yaw * 180) / Math.PI).toFixed(6)),
                  pitch: Number(
                    ((-viewCoords.pitch * 180) / Math.PI).toFixed(6),
                  ),
                },
              }),
            );
          }

          return true;
        };

        const endDrag = () => {
          if (!dragState.active) {
            return;
          }
          dragState.active = false;
          dragState.pointerId = null;
          dragHandle.style.cursor = "grab";
        };

        dragHandle.addEventListener("pointerdown", (event) => {
          if (event.button !== 0) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          dragState.active = true;
          dragState.pointerId = event.pointerId;
          dragState.startClientX = event.clientX;
          dragState.startClientY = event.clientY;
          dragState.hasDragged = false;
          dragState.suppressClick = false;
          dragHandle.style.cursor = "grabbing";
          dragHandle.setPointerCapture?.(event.pointerId);
        });

        dragHandle.addEventListener("pointermove", (event) => {
          if (!dragState.active || event.pointerId !== dragState.pointerId) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();

          if (!dragState.hasDragged) {
            const movedX = Math.abs(event.clientX - dragState.startClientX);
            const movedY = Math.abs(event.clientY - dragState.startClientY);
            if (
              movedX < DRAG_START_DISTANCE_PX &&
              movedY < DRAG_START_DISTANCE_PX
            ) {
              return;
            }
            dragState.hasDragged = true;
          }

          dragState.suppressClick = true;
          updateFromEvent(event, false);
        });

        dragHandle.addEventListener("pointerup", (event) => {
          if (!dragState.active || event.pointerId !== dragState.pointerId) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          if (dragState.hasDragged) {
            updateFromEvent(event, true);
          }
          if (dragHandle.hasPointerCapture?.(event.pointerId)) {
            dragHandle.releasePointerCapture(event.pointerId);
          }
          endDrag();
        });

        dragHandle.addEventListener("pointercancel", () => {
          endDrag();
        });

        dragHandle.addEventListener("click", (event) => {
          if (!dragState.suppressClick) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          dragState.suppressClick = false;
        });
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
        for (let i = 0; i < activeData.scenes.length; i += 1) {
          if (activeData.scenes[i].id === id) {
            return activeData.scenes[i];
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

      const runtimeViewState = readRuntimeViewState();
      const runtimeScene = runtimeViewState
        ? findSceneById(runtimeViewState.sceneId)
        : null;

      if (runtimeScene && runtimeViewState) {
        switchScene(runtimeScene, {
          yaw: degToRad(runtimeViewState.yaw),
          pitch: degToRad(runtimeViewState.pitch),
          fov: degToRad(runtimeViewState.fov),
        });
      } else {
        switchScene(scenes[0]);
      }
    };

    init();

    return () => {
      disposed = true;
      if (onInfoPickStart) {
        window.removeEventListener(
          "playground:infohotspot-pick-start",
          onInfoPickStart,
        );
      }
      if (onLinkPickStart) {
        window.removeEventListener(
          "playground:linkhotspot-pick-start",
          onLinkPickStart,
        );
      }
      if (onPreserveCurrentViewChanged) {
        window.removeEventListener(
          "playground:preserve-current-view-changed",
          onPreserveCurrentViewChanged,
        );
      }
      if (onViewerSettingsChanged) {
        window.removeEventListener(
          "playground:viewer-settings-changed",
          onViewerSettingsChanged,
        );
      }
      viewChangeListeners.forEach(({ view, handler }) => {
        view.removeEventListener("change", handler);
      });
      const panoElement = root.querySelector("#pano");
      if (onPanoClickForInfoPick) {
        panoElement?.removeEventListener("click", onPanoClickForInfoPick, true);
      }
      if (onPanoClickForLinkPick) {
        panoElement?.removeEventListener("click", onPanoClickForLinkPick, true);
      }
      if (onPanoPointerUpForViewSave) {
        panoElement?.removeEventListener(
          "pointerup",
          onPanoPointerUpForViewSave,
          true,
        );
      }
      if (onPanoWheelForViewSave) {
        panoElement?.removeEventListener("wheel", onPanoWheelForViewSave, true);
      }
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
      body.classList.remove("playground-floorplan-contained");
      body.style.removeProperty("--playground-floorplan-top");
      body.style.removeProperty("--playground-floorplan-left");
      body.style.removeProperty("--playground-floorplan-width");
      body.style.removeProperty("--playground-floorplan-height");
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateFloorplanBounds);
      window.removeEventListener("scroll", updateFloorplanBounds);
      infoModals.forEach((modal) => modal.remove());
      if (viewerInstance && typeof viewerInstance.destroy === "function") {
        viewerInstance.destroy();
        viewerInstance = null;
      }
    };
  }, [assetUrls, activeData]);

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-black max-md:flex-col">
      <main className="relative flex min-h-0 flex-1 overflow-hidden">
        <div ref={rootRef} className="sample-ai-root">
          {topBarTarget &&
            createPortal(
              <MarzipanoTopBar
                scenes={activeData.scenes}
                assetUrls={assetUrls}
                floorplanPositions={activeFloorplanPositions}
                enableFloorplanMarkerDrag
              />,
              topBarTarget,
            )}
          <div id="pano" />

          <button
            type="button"
            id="viewUp"
            className="viewControlButton viewControlButton-1"
            aria-label="View up"
          >
            <IoChevronUp className="icon" aria-hidden="true" />
          </button>
          <button
            type="button"
            id="viewDown"
            className="viewControlButton viewControlButton-2"
            aria-label="View down"
          >
            <IoChevronDown className="icon" aria-hidden="true" />
          </button>
          <button
            type="button"
            id="viewLeft"
            className="viewControlButton viewControlButton-3"
            aria-label="View left"
          >
            <IoChevronForward
              className="icon"
              aria-hidden="true"
              style={{ transform: "rotate(180deg)" }}
            />
          </button>
          <button
            type="button"
            id="viewRight"
            className="viewControlButton viewControlButton-4"
            aria-label="View right"
          >
            <IoChevronForward className="icon" aria-hidden="true" />
          </button>
          <button
            type="button"
            id="viewIn"
            className="viewControlButton viewControlButton-5"
            aria-label="Zoom in"
          >
            <IoAdd className="icon" aria-hidden="true" />
          </button>
          <button
            type="button"
            id="viewOut"
            className="viewControlButton viewControlButton-6"
            aria-label="Zoom out"
          >
            <IoRemove className="icon" aria-hidden="true" />
          </button>
        </div>
      </main>

      <aside className="w-[340px] overflow-hidden transition-all duration-300 ease-in-out max-md:h-auto max-md:max-h-[45vh] max-md:w-full">
        <div className="relative flex h-full w-full flex-col overflow-hidden bg-slate-100 text-slate-900 max-[600px]:text-[0.78rem]">
          <div className="flex items-baseline gap-2 border-b border-black/10 bg-slate-200 px-4 py-3 text-[0.95rem] max-[900px]:px-3 max-[900px]:py-2">
            <div className="flex items-center gap-2">
              <strong className="text-sm font-bold tracking-wide text-slate-700">
                Build your tour
              </strong>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsTourInfoModalOpen(true)}
            aria-label="Open tour information"
            className="absolute bottom-3 right-3 z-10 text-slate-600 transition-colors hover:text-slate-900"
          >
            <IoInformationCircleOutline className="text-lg" />
          </button>
          <Form
            initialData={data}
            initialFloorplanPositions={floorplanScenePositions}
            initialFloorplanImageUrl={data.floorplanImageUrl || ""}
            onRuntimeDataChange={({ data: nextData, floorplanPositions }) => {
              setRuntimeData(nextData);
              setRuntimeFloorplanPositions(floorplanPositions);
            }}
          />
        </div>
      </aside>
      <TourInfoModal
        open={isTourInfoModalOpen}
        onClose={() => setIsTourInfoModalOpen(false)}
      />
    </div>
  );
};

export default Playground;
