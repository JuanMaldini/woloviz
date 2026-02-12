import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import bowser from "bowser";
import "../style.css";
import MarzipanoTopBar from "../components/MarzipanoTopBar";
import Form from "./Form";
import { data, floorplanScenePositions } from "./data";

const Playground = () => {
  const rootRef = useRef(null);
  const [topBarTarget, setTopBarTarget] = useState(null);

  const degToRad = (deg) => (deg * Math.PI) / 180;
  const hotspotPitchSign = -1;

  const assetUrls = useMemo(
    () => ({
      play: new URL("../imgButtons/play.png", import.meta.url).href,
      pause: new URL("../imgButtons/pause.png", import.meta.url).href,
      fullscreen: new URL("../imgButtons/fullscreen.png", import.meta.url).href,
      windowed: new URL("../imgButtons/windowed.png", import.meta.url).href,
      expand: new URL("../imgButtons/expand.png", import.meta.url).href,
      collapse: new URL("../imgButtons/collapse.png", import.meta.url).href,
      up: new URL("../imgButtons/up.png", import.meta.url).href,
      down: new URL("../imgButtons/down.png", import.meta.url).href,
      left: new URL("../imgButtons/left.png", import.meta.url).href,
      right: new URL("../imgButtons/right.png", import.meta.url).href,
      plus: new URL("../imgButtons/plus.png", import.meta.url).href,
      minus: new URL("../imgButtons/minus.png", import.meta.url).href,
      link: new URL("../imgButtons/location.png", import.meta.url).href,
      location: new URL("../imgButtons/location.png", import.meta.url).href,
      floorplan: new URL(
        data.floorplanImageUrl || "/projects/Sampleai/Floorplan.png",
        import.meta.url,
      ).href,
      info: new URL("../imgButtons/info.png", import.meta.url).href,
      close: new URL("../imgButtons/close.png", import.meta.url).href,
    }),
    [],
  );

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
    if (data.settings.viewControlButtons) {
      bodyClasses.push("view-control-buttons");
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
    const infoModals = [];

    const init = async () => {
      try {
        await loadScriptOnce("/build/marzipano.js", "marzipano");
        await loadScriptOnce(
          "https://www.marzipano.net/demos/common/screenfull.js",
          "screenfull",
        );
      } catch (error) {
        console.error("Failed to load Marzipano scripts", error);
        return;
      }

      if (disposed) {
        return;
      }

      const Marzipano = window.Marzipano;
      const screenfull = window.screenfull;

      if (!Marzipano) {
        console.error("Marzipano is not available on window");
        return;
      }

      const panoElement = root.querySelector("#pano");
      const sceneNameElement = document.querySelector("#titleBar .sceneName");
      const sceneListElement = document.querySelector("#sceneList");
      const sceneElements = document.querySelectorAll(".scene[data-id]");
      const sceneListToggleElement = document.querySelector("#sceneListToggle");
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

      const scenes = data.scenes.map((sceneData) => {
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

      const viewUpElement = root.querySelector("#viewUp");
      const viewDownElement = root.querySelector("#viewDown");
      const viewLeftElement = root.querySelector("#viewLeft");
      const viewRightElement = root.querySelector("#viewRight");
      const viewInElement = root.querySelector("#viewIn");
      const viewOutElement = root.querySelector("#viewOut");

      if (!data.settings.viewControlButtons) {
        [
          viewUpElement,
          viewDownElement,
          viewLeftElement,
          viewRightElement,
          viewInElement,
          viewOutElement,
        ].forEach((el) => {
          if (el) {
            el.style.display = "none";
          }
        });
      }

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

        const icon = document.createElement("img");
        icon.src = assetUrls.link;
        icon.classList.add("link-hotspot-icon");

        const rotation = hotspot.rotation ?? 0;
        icon.style.setProperty("--hotspot-rotation", `${rotation}rad`);

        wrapper.addEventListener("click", () => {
          switchScene(findSceneById(hotspot.target));
        });

        stopTouchAndScrollEventPropagation(wrapper);

        const tooltip = document.createElement("div");
        tooltip.classList.add("hotspot-tooltip", "link-hotspot-tooltip");
        tooltip.innerHTML = findSceneDataById(hotspot.target).name;

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
        const icon = document.createElement("img");
        icon.src = assetUrls.info;
        icon.classList.add("info-hotspot-icon");
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
      const toggleEl = document.querySelector("#sceneListToggle");
      if (toggleEl) {
        toggleEl.onclick = null;
      }
      bodyClasses.forEach((className) => body.classList.remove(className));
      body.classList.remove("marzipano-navbar");
      infoModals.forEach((modal) => modal.remove());
    };
  }, [assetUrls]);

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-black max-md:flex-col">
      <main className="relative flex min-h-0 flex-1 overflow-hidden">
        <div ref={rootRef} className="sample-ai-root">
          {topBarTarget &&
            createPortal(
              <MarzipanoTopBar
                scenes={data.scenes}
                assetUrls={assetUrls}
                floorplanPositions={floorplanScenePositions}
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
            <img className="icon" src={assetUrls.up} alt="Up" />
          </button>
          <button
            type="button"
            id="viewDown"
            className="viewControlButton viewControlButton-2"
            aria-label="View down"
          >
            <img className="icon" src={assetUrls.down} alt="Down" />
          </button>
          <button
            type="button"
            id="viewLeft"
            className="viewControlButton viewControlButton-3"
            aria-label="View left"
          >
            <img className="icon" src={assetUrls.left} alt="Left" />
          </button>
          <button
            type="button"
            id="viewRight"
            className="viewControlButton viewControlButton-4"
            aria-label="View right"
          >
            <img className="icon" src={assetUrls.right} alt="Right" />
          </button>
          <button
            type="button"
            id="viewIn"
            className="viewControlButton viewControlButton-5"
            aria-label="Zoom in"
          >
            <img className="icon" src={assetUrls.plus} alt="Zoom in" />
          </button>
          <button
            type="button"
            id="viewOut"
            className="viewControlButton viewControlButton-6"
            aria-label="Zoom out"
          >
            <img className="icon" src={assetUrls.minus} alt="Zoom out" />
          </button>
        </div>
      </main>

      <aside className="w-[340px] overflow-hidden transition-all duration-300 ease-in-out max-md:h-auto max-md:max-h-[45vh] max-md:w-full">
        <div className="relative flex h-full w-full flex-col overflow-hidden bg-slate-100 text-slate-900 max-[600px]:text-[0.78rem]">
          <div className="flex items-baseline justify-between gap-2 border-b border-black/10 bg-slate-200 px-4 py-3 text-[0.95rem] max-[900px]:px-3 max-[900px]:py-2">
            <strong className="text-sm font-bold tracking-wide text-slate-700">
              Build your tour
            </strong>
          </div>
          <Form
            initialData={data}
            initialFloorplanPositions={floorplanScenePositions}
            initialFloorplanImageUrl={data.floorplanImageUrl || ""}
          />
        </div>
      </aside>
    </div>
  );
};

export default Playground;
