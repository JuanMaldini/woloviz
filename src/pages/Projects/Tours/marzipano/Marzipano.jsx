import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { renderToStaticMarkup } from "react-dom/server";
import { FaLocationDot } from "react-icons/fa6";
import {
  IoAdd,
  IoChevronDown,
  IoChevronForward,
  IoChevronUp,
  IoInformationCircleOutline,
  IoRemove,
} from "react-icons/io5";
import bowser from "bowser";
import "../style.css";
import MarzipanoTopBar from "../components/MarzipanoTopBar";

const data = {
  scenes: [
    {
      id: "oriente-station",
      name: "Oriente Station",
      levels: [
        { tileSize: 256, size: 256, fallbackOnly: true },
        { tileSize: 512, size: 512 },
        { tileSize: 512, size: 1024 },
        { tileSize: 512, size: 2048 },
        { tileSize: 512, size: 4096 },
      ],
      faceSize: 4096,
      initialViewParameters: {
        pitch: 0,
        yaw: 0,
        fov: 1.5707963267948966,
      },
      linkHotspots: [
        {
          yaw: 3.12678386676067,
          pitch: -0.0076340532339251865,
          rotation: 0,
          target: "electricity-museum",
        },
      ],
      infoHotspots: [
        {
          yaw: -0.00038049728702915786,
          pitch: 0.014985751462495145,
          title: "Oriente Station",
          text: "The Oriente Station is one of the most important bus and train stations in the city. Designed by the Spanish architect and engineer Santiago Calatrava, it has an enormous metal skeleton that covers the eight train lines and its platforms. Finished in 1998 to serve the Expo’98 and, later, the Parque das Nações area, in its surroundings are companies, services, hotels, bars, animation, as well as the well known Vasco da Gama shopping centre.",
        },
      ],
    },
    {
      id: "electricity-museum",
      name: "Electricity Museum",
      levels: [
        { tileSize: 256, size: 256, fallbackOnly: true },
        { tileSize: 512, size: 512 },
        { tileSize: 512, size: 1024 },
        { tileSize: 512, size: 2048 },
        { tileSize: 512, size: 4096 },
      ],
      faceSize: 4096,
      initialViewParameters: {
        pitch: 0,
        yaw: 0,
        fov: 1.5707963267948966,
      },
      linkHotspots: [
        {
          yaw: -2.3152585099587224,
          pitch: 0.045251205931975846,
          rotation: 5.497787143782138,
          target: "jeronimos",
        },
      ],
      infoHotspots: [
        {
          yaw: -0.1606464893205768,
          pitch: -0.17433292221669205,
          title: "Boilers Room",
          text: "In the impressive Boilers Room at the Electricity Museum we find four large boilers of about 100 feet tall, with their respective control panels, air and fuel circuits, ventilators, etc. Boiler number 15 has been musealised and visitors may go in and discover its structure and internal component: conveyor belt, Bailey walls, naphtha burners, water heating tubes, and so on.",
        },
      ],
    },
    {
      id: "jeronimos",
      name: "Jerónimos Monastery",
      levels: [
        { tileSize: 256, size: 256, fallbackOnly: true },
        { tileSize: 512, size: 512 },
        { tileSize: 512, size: 1024 },
        { tileSize: 512, size: 2048 },
        { tileSize: 512, size: 4096 },
      ],
      faceSize: 4096,
      initialViewParameters: {
        pitch: 0,
        yaw: 0,
        fov: 1.5707963267948966,
      },
      linkHotspots: [
        {
          yaw: -0.775981148319735,
          pitch: 0.2661802812323746,
          rotation: 0,
          target: "oriente-station",
        },
      ],
      infoHotspots: [
        {
          yaw: 0.5350080558065997,
          pitch: 0.24525106321929435,
          title: "Jerónimos Monastery",
          text: "The Jerónimos Monastery cloister is a pleasant and serene place intended to foster monks’ prayers and meditation. Its manuelin decoration features decorative religious, nautical and royal elements, as well as vegetal motifs. Since 1985, the tomb of the poet Fernando Pessoa rests in the north wing of the cloister’s ground floor.",
        },
      ],
    },
  ],
  name: "Marzipano Tour",
  settings: {
    mouseViewMode: "drag",
    autorotateEnabled: true,
    fullscreenButton: true,
    viewControlButtons: true,
  },
};

const Marzipano = () => {
  const rootRef = useRef(null);
  const [topBarTarget, setTopBarTarget] = useState(null);

  const assetUrls = useMemo(
    () => ({
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
        return;
      }

      if (disposed) {
        return;
      }

      const Marzipano = window.Marzipano;
      const screenfull = window.screenfull;

      if (!Marzipano) {
        return;
      }

      const uiScope = document;
      const panoElement = root.querySelector("#pano");
      const sceneNameElement = uiScope.querySelector("#titleBar .sceneName");
      const sceneListElement = uiScope.querySelector("#sceneList");
      const sceneElements = uiScope.querySelectorAll(".scene[data-id]");
      const sceneListToggleElement = uiScope.querySelector("#sceneListToggle");
      const autorotateToggleElement =
        uiScope.querySelector("#autorotateToggle");
      const fullscreenToggleElement =
        uiScope.querySelector("#fullscreenToggle");

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
        const urlPrefix = "//www.marzipano.net/media";
        const source = Marzipano.ImageUrlSource.fromString(
          `${urlPrefix}/${sceneData.id}/{z}/{f}/{y}/{x}.jpg`,
          { cubeMapPreviewUrl: `${urlPrefix}/${sceneData.id}/preview.jpg` },
        );
        const geometry = new Marzipano.CubeGeometry(sceneData.levels);

        const limiter = Marzipano.RectilinearView.limit.traditional(
          sceneData.faceSize,
          (100 * Math.PI) / 180,
          (120 * Math.PI) / 180,
        );
        const view = new Marzipano.RectilinearView(
          sceneData.initialViewParameters,
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
          scene
            .hotspotContainer()
            .createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
        });

        sceneData.infoHotspots.forEach((hotspot) => {
          const element = createInfoHotspotElement(hotspot);
          scene
            .hotspotContainer()
            .createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
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

      sceneListToggleElement?.addEventListener("click", toggleSceneList);

      if (!document.body.classList.contains("mobile")) {
        showSceneList();
      }

      scenes.forEach((scene) => {
        const elements = uiScope.querySelectorAll(
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

      function switchScene(scene) {
        stopAutorotate();
        scene.view.setParameters(scene.data.initialViewParameters);
        scene.scene.switchTo();
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

        const transformProperties = [
          "-ms-transform",
          "-webkit-transform",
          "transform",
        ];
        for (let i = 0; i < transformProperties.length; i += 1) {
          const property = transformProperties[i];
          icon.style[property] = `rotate(${hotspot.rotation}rad)`;
        }

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
      bodyClasses.forEach((className) => body.classList.remove(className));
      body.classList.remove("marzipano-navbar");
      infoModals.forEach((modal) => modal.remove());
    };
  }, [assetUrls]);

  return (
    <div ref={rootRef} className="sample-ai-root">
      <div id="pano" />

      {topBarTarget ? (
        createPortal(
          <MarzipanoTopBar
            scenes={data.scenes}
            assetUrls={assetUrls}
            showFloorplan={false}
          />,
          topBarTarget,
        )
      ) : (
        <MarzipanoTopBar
          scenes={data.scenes}
          assetUrls={assetUrls}
          showFloorplan={false}
        />
      )}

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
  );
};

export default Marzipano;
