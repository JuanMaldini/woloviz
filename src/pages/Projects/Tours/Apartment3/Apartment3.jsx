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

// Percentage-based positions so markers stay aligned on resize.
const floorplanScenePositions = [
  { id: "scene1", x: 58, y: 32 },
  { id: "scene2", x: 76, y: 32 },
  { id: "scene3", x: 41, y: 32 },
  { id: "scene4", x: 23, y: 32 },
  { id: "scene5", x: 23, y: 73 },
  { id: "scene6", x: 46, y: 46 },
  { id: "scene7", x: 50, y: 73 },
  { id: "scene8", x: 75, y: 73 },
  { id: "scene9", x: 81, y: 61 },
];

const data = {
  scenes: [
    {
      id: "scene1",
      name: "Scene 1",
      imageUrl: `/projects/Sampleaib/Sample_AI09_01.jpg`,
      equirectWidth: 4000,
      initialViewParameters: { pitch: -3, yaw: 117, fov: 110 },
      linkHotspots: [
        { yaw: 76, pitch: -39.3, target: "scene2" },
        { yaw: -79.3, pitch: -39.5, target: "scene3" },
        { yaw: -83.7, pitch: -22.5, target: "scene4" },
        {
          yaw: -137.44656566250043,
          pitch: -15.54410302288399,
          target: "scene5",
        },
        {
          yaw: -123.6022459805157,
          pitch: -36.71850384146028,
          target: "scene6",
        },
        {
          yaw: -169.84819835377016,
          pitch: -19.12233911507805,
          target: "scene7",
        },
        {
          yaw: 157.45360506549025,
          pitch: -16.182970890091525,
          target: "scene8",
        },
        {
          yaw: 131.86112603426764,
          pitch: -17.201298350399053,
          target: "scene9",
        },
      ],
      infoHotspots: [],
    },
    {
      id: "scene2",
      name: "Scene 2",
      imageUrl: "/projects/Sampleaib/Sample_AI09_02.jpg",
      equirectWidth: 4000,
      linkHotspots: [
        { yaw: -78.85, pitch: -39.85, target: "scene1" },
        { yaw: -84.7, pitch: -22.5, target: "scene3" },
        { yaw: -86.13, pitch: -14.83, target: "scene4" },
        { yaw: -127.16599392678768, pitch: -9.8487250459484, target: "scene5" },
        {
          yaw: -108.21319395489375,
          pitch: -21.694775034377916,
          target: "scene6",
        },
        {
          yaw: -148.00223758910363,
          pitch: -17.249935247456012,
          target: "scene7",
        },
        {
          yaw: 178.4830489771014,
          pitch: -21.483661654666783,
          target: "scene8",
        },
        {
          yaw: 168.61775631221477,
          pitch: -33.211903121259084,
          target: "scene9",
        },
      ],
      infoHotspots: [],
    },
    {
      id: "scene3",
      name: "Scene 3",
      imageUrl: "/projects/Sampleaib/Sample_AI09_03.jpg",
      equirectWidth: 4000,
      linkHotspots: [
        { yaw: 78.85, pitch: -39.85, target: "scene1" },
        { yaw: 82.8, pitch: -20.5, target: "scene2" },
        { yaw: -83, pitch: -40, target: "scene4" },
        {
          yaw: -154.76473301441618,
          pitch: -19.02507533822296,
          target: "scene5",
        },
        { yaw: 169.01358570131745, pitch: -47.8310697985946, target: "scene6" },
        { yaw: 167.201410333578, pitch: -16.912169045298757, target: "scene7" },
        {
          yaw: 137.54499892899565,
          pitch: -16.091680957318797,
          target: "scene8",
        },
        {
          yaw: 121.96174179271367,
          pitch: -12.091947020653173,
          target: "scene9",
        },
      ],
      infoHotspots: [],
    },
    {
      id: "scene4",
      name: "Scene 4",
      imageUrl: "/projects/Sampleaib/Sample_AI09_04.jpg",
      equirectWidth: 4000,
      linkHotspots: [
        { yaw: 83.34, pitch: -22.26, target: "scene1" },
        { yaw: 84.9, pitch: -14.98, target: "scene2" },
        { yaw: 78.2, pitch: -39, target: "scene3" },
        {
          yaw: -178.94586609971043,
          pitch: -20.733420533908816,
          target: "scene5",
        },
        {
          yaw: 120.70057724831881,
          pitch: -28.679708683621662,
          target: "scene6",
        },
        { yaw: 147.6725101755357, pitch: -16.21390483985229, target: "scene7" },
        {
          yaw: 123.76136172388765,
          pitch: -12.010246671985387,
          target: "scene8",
        },
        {
          yaw: 112.36683727588053,
          pitch: -8.095310457991827,
          target: "scene9",
        },
      ],
      infoHotspots: [],
    },
    {
      id: "scene5",
      name: "Scene 5",
      imageUrl: "/projects/Sampleaib/Sample_AI09_05.jpg",
      equirectWidth: 4000,
      linkHotspots: [
        { yaw: 40.28816438988322, pitch: -17.36874125533316, target: "scene1" },
        { yaw: 52.53304877938946, pitch: -13.18578139862265, target: "scene2" },
        {
          yaw: 20.018597248567815,
          pitch: -20.124284707485618,
          target: "scene3",
        },
        {
          yaw: -6.427350792947299,
          pitch: -21.183348165899343,
          target: "scene4",
        },
        {
          yaw: 40.745006906348195,
          pitch: -29.522495115816653,
          target: "scene6",
        },
        { yaw: 104.50636072608798, pitch: -33.3487823908823, target: "scene7" },
        { yaw: 96.86297950518878, pitch: -16.54278648905028, target: "scene8" },
        { yaw: 79.9568347627397, pitch: -14.189714973171053, target: "scene9" },
      ],
      infoHotspots: [],
    },
    {
      id: "scene6",
      name: "Scene 6",
      imageUrl: "/projects/Sampleaib/Sample_AI09_06.jpg",
      equirectWidth: 4000,
      linkHotspots: [
        {
          yaw: 40.10544356810522,
          pitch: -31.163373949401862,
          target: "scene1",
        },
        { yaw: 59.77693379377578, pitch: -20.28979049413677, target: "scene2" },
        {
          yaw: -3.9811814423990715,
          pitch: -38.274376766243684,
          target: "scene3",
        },
        {
          yaw: -48.479075915685065,
          pitch: -28.222816532607172,
          target: "scene4",
        },
        {
          yaw: -139.3652455733243,
          pitch: -23.691310907868168,
          target: "scene5",
        },
        {
          yaw: 161.6564590249756,
          pitch: -29.003184150971585,
          target: "scene7",
        },
        {
          yaw: 123.59358293242587,
          pitch: -20.079889909033017,
          target: "scene8",
        },
        {
          yaw: 101.38726200220353,
          pitch: -15.661701680967486,
          target: "scene9",
        },
      ],
      infoHotspots: [],
    },
    {
      id: "scene7",
      name: "Scene 7",
      imageUrl: "/projects/Sampleaib/Sample_AI09_07.jpg",
      equirectWidth: 4000,
      linkHotspots: [
        {
          yaw: 10.78535391084768,
          pitch: -18.447826580454247,
          target: "scene1",
        },
        {
          yaw: 30.45076194981643,
          pitch: -15.318869462125221,
          target: "scene2",
        },
        {
          yaw: -11.981568169786621,
          pitch: -18.343435907245166,
          target: "scene3",
        },
        { yaw: -31.77007008893558, pitch: -21.5103366181141, target: "scene4" },
        { yaw: -90.0166369015954, pitch: -28.05904379980902, target: "scene5" },
        {
          yaw: -16.114712877435473,
          pitch: -27.80749980852305,
          target: "scene6",
        },
        { yaw: 85.9337419973798, pitch: -29.431855736905604, target: "scene8" },
        {
          yaw: 64.02675077852737,
          pitch: -22.142183292534014,
          target: "scene9",
        },
      ],
      infoHotspots: [],
    },
    {
      id: "scene8",
      name: "Scene 8",
      imageUrl: "/projects/Sampleaib/Sample_AI09_08.jpg",
      equirectWidth: 4000,
      linkHotspots: [
        {
          yaw: -19.95949433094716,
          pitch: -12.740081481550195,
          target: "scene1",
        },
        {
          yaw: 2.0767381860122773,
          pitch: -18.855971290316656,
          target: "scene2",
        },
        {
          yaw: -37.78479291226232,
          pitch: -14.690884797372796,
          target: "scene3",
        },
        {
          yaw: -50.67139990471715,
          pitch: -11.98857033393422,
          target: "scene4",
        },
        {
          yaw: -90.5242565629528,
          pitch: -15.208363763527167,
          target: "scene5",
        },
        {
          yaw: -51.70541966413192,
          pitch: -15.897946138116595,
          target: "scene6",
        },
        {
          yaw: -92.6543497506861,
          pitch: -30.500596596804016,
          target: "scene7",
        },
        { yaw: 20.14232144595964, pitch: -42.64444420404129, target: "scene9" },
      ],
      infoHotspots: [],
    },
    {
      id: "scene9",
      name: "Scene 9",
      imageUrl: "/projects/Sampleaib/Sample_AI09_09.jpg",
      equirectWidth: 4000,
      linkHotspots: [
        {
          yaw: -37.58376719775619,
          pitch: -17.620729859395748,
          target: "scene1",
        },
        {
          yaw: -7.5519614412622795,
          pitch: -27.636903609666927,
          target: "scene2",
        },
        { yaw: -55.468526191535, pitch: -15.947504283700706, target: "scene3" },
        {
          yaw: -64.2978640805966,
          pitch: -12.533678648129888,
          target: "scene4",
        },
        {
          yaw: -106.68635419388208,
          pitch: -12.986830038576985,
          target: "scene5",
        },
        {
          yaw: -73.06478792983197,
          pitch: -15.515865409406528,
          target: "scene6",
        },
        {
          yaw: -119.69140424465037,
          pitch: -22.445093176570886,
          target: "scene7",
        },
        {
          yaw: -162.5179985376181,
          pitch: -39.85751604757657,
          target: "scene8",
        },
      ],
      infoHotspots: [],
    },
  ],
  name: "Apartment-3",
  settings: {
    mouseViewMode: "drag",
    autorotateEnabled: false,
    fullscreenButton: true,
    viewControlButtons: true,
  },
};

const Apartment3 = () => {
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
      floorplan: new URL("/projects/Sampleaib/Floorplan.png", import.meta.url)
        .href,
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

export default Apartment3;
