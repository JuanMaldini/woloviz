import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createOverrideMaterial } from "../components/override_material";

const ORBIT_OVERRIDE_MATERIAL_ACTIVE = false;
const GLB_MAX_RETRIES = 2;
const GLB_RETRY_DELAY_MS = 700;
const NOISELESS_GLB_URL = "/projects/Sampleai/noiseless.glb";

function Controls_Orbit() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    let loadedModel = null;
    const gltfLoader = new GLTFLoader();
    const sampleGlbCandidates = [NOISELESS_GLB_URL];
    const targetModelHeight = 24;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcccccc);
    scene.fog = new THREE.FogExp2(0xcccccc, 0.002);
    const overrideMaterial = createOverrideMaterial({
      enabled: ORBIT_OVERRIDE_MATERIAL_ACTIVE,
      grayValue: 180,
    });

    if (overrideMaterial) {
      scene.overrideMaterial = overrideMaterial;
    }

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      1,
      1000,
    );
    camera.position.set(400, 200, 0);

    const isTouchDevice =
      window.matchMedia("(pointer: coarse)").matches ||
      navigator.maxTouchPoints > 0;
    const renderer = new THREE.WebGLRenderer({ antialias: !isTouchDevice });
    renderer.setPixelRatio(
      isTouchDevice ? 1 : Math.min(window.devicePixelRatio, 2),
    );
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.listenToKeyEvents(window);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 2;
    controls.maxDistance = 5000;
    controls.maxPolarAngle = Math.PI / 2;
    const hitRaycaster = new THREE.Raycaster();
    const hitPointerNdc = new THREE.Vector2();
    const hitPoint = new THREE.Vector3();
    const smoothTravel = {
      active: false,
      startTime: 0,
      duration: 520,
      startTarget: new THREE.Vector3(),
      endTarget: new THREE.Vector3(),
    };
    const pointerGesture = {
      active: false,
      pointerId: null,
      startX: 0,
      startY: 0,
      latestX: 0,
      latestY: 0,
      moved: false,
      pointerType: "",
      startTime: 0,
    };
    let lastTapTime = 0;
    let lastTapX = 0;
    let lastTapY = 0;
    let lastMouseClickTime = 0;
    let lastMouseClickX = 0;
    let lastMouseClickY = 0;

    const verticalMotion = {
      moveUp: false,
      moveDown: false,
      velocity: 0,
      acceleration: 2,
      damping: 7,
      maxSpeed: 3,
      touchSensitivity: 0.18,
    };
    const activeTouchPoints = new Map();
    const twoFingerVertical = {
      active: false,
      lastCentroidY: 0,
    };

    const isEditableElement = (target) => {
      if (!target) {
        return false;
      }

      const tagName = target.tagName;
      return (
        target.isContentEditable ||
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        tagName === "SELECT"
      );
    };

    const getTouchCentroidY = () => {
      let totalY = 0;
      activeTouchPoints.forEach((point) => {
        totalY += point.y;
      });

      return totalY / activeTouchPoints.size;
    };

    const tryStartTravelToScreenPoint = (clientX, clientY) => {
      if (!loadedModel) {
        return;
      }

      const rect = renderer.domElement.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return;
      }

      hitPointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      hitPointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      hitRaycaster.setFromCamera(hitPointerNdc, camera);
      const hits = hitRaycaster.intersectObject(loadedModel, true);

      if (!hits.length) {
        return;
      }

      hitPoint.copy(hits[0].point);
      smoothTravel.startTarget.copy(controls.target);
      smoothTravel.endTarget.copy(hitPoint);
      smoothTravel.startTime = performance.now();
      smoothTravel.active = true;
    };

    const beginTwoFingerVerticalIfNeeded = () => {
      if (activeTouchPoints.size === 2 && !twoFingerVertical.active) {
        twoFingerVertical.active = true;
        twoFingerVertical.lastCentroidY = getTouchCentroidY();
        controls.enabled = false;
      }
    };

    const stopTwoFingerVerticalIfNeeded = () => {
      if (twoFingerVertical.active && activeTouchPoints.size < 2) {
        twoFingerVertical.active = false;
        controls.enabled = true;
      }
    };

    const onKeyDown = (event) => {
      if (isEditableElement(event.target)) {
        return;
      }

      if (event.code === "KeyE") {
        verticalMotion.moveUp = true;
        event.preventDefault();
      }

      if (event.code === "KeyQ") {
        verticalMotion.moveDown = true;
        event.preventDefault();
      }
    };

    const onKeyUp = (event) => {
      if (event.code === "KeyE") {
        verticalMotion.moveUp = false;
      }

      if (event.code === "KeyQ") {
        verticalMotion.moveDown = false;
      }
    };

    const onPointerDown = (event) => {
      pointerGesture.active = true;
      pointerGesture.pointerId = event.pointerId;
      pointerGesture.startX = event.clientX;
      pointerGesture.startY = event.clientY;
      pointerGesture.latestX = event.clientX;
      pointerGesture.latestY = event.clientY;
      pointerGesture.moved = false;
      pointerGesture.pointerType = event.pointerType;
      pointerGesture.startTime = performance.now();

      if (event.pointerType !== "touch") {
        return;
      }

      activeTouchPoints.set(event.pointerId, {
        y: event.clientY,
      });

      beginTwoFingerVerticalIfNeeded();
    };

    const onPointerMove = (event) => {
      if (
        pointerGesture.active &&
        pointerGesture.pointerId === event.pointerId
      ) {
        pointerGesture.latestX = event.clientX;
        pointerGesture.latestY = event.clientY;
        const dx = event.clientX - pointerGesture.startX;
        const dy = event.clientY - pointerGesture.startY;
        if (!pointerGesture.moved && dx * dx + dy * dy > 64) {
          pointerGesture.moved = true;
        }
      }

      if (event.pointerType !== "touch") {
        return;
      }

      if (!activeTouchPoints.has(event.pointerId)) {
        return;
      }

      activeTouchPoints.set(event.pointerId, {
        y: event.clientY,
      });

      beginTwoFingerVerticalIfNeeded();

      if (!twoFingerVertical.active || activeTouchPoints.size !== 2) {
        return;
      }

      const centroidY = getTouchCentroidY();
      const deltaY = centroidY - twoFingerVertical.lastCentroidY;
      twoFingerVertical.lastCentroidY = centroidY;

      verticalMotion.velocity += deltaY * verticalMotion.touchSensitivity;
      verticalMotion.velocity = THREE.MathUtils.clamp(
        verticalMotion.velocity,
        -verticalMotion.maxSpeed,
        verticalMotion.maxSpeed,
      );
      event.preventDefault();
    };

    const onPointerEnd = (event) => {
      if (
        pointerGesture.active &&
        pointerGesture.pointerId === event.pointerId
      ) {
        const now = performance.now();
        const tapDuration = now - pointerGesture.startTime;
        const isTapLike = !pointerGesture.moved && tapDuration < 300;

        if (isTapLike && pointerGesture.pointerType === "mouse") {
          const dx = pointerGesture.latestX - lastMouseClickX;
          const dy = pointerGesture.latestY - lastMouseClickY;
          const nearPreviousClick = dx * dx + dy * dy <= 36 * 36;
          const isDoubleClick =
            now - lastMouseClickTime > 0 &&
            now - lastMouseClickTime < 340 &&
            nearPreviousClick;

          if (isDoubleClick) {
            tryStartTravelToScreenPoint(
              pointerGesture.latestX,
              pointerGesture.latestY,
            );
          }

          lastMouseClickTime = now;
          lastMouseClickX = pointerGesture.latestX;
          lastMouseClickY = pointerGesture.latestY;
        }

        if (isTapLike && pointerGesture.pointerType === "touch") {
          const dx = pointerGesture.latestX - lastTapX;
          const dy = pointerGesture.latestY - lastTapY;
          const nearPreviousTap = dx * dx + dy * dy <= 36 * 36;
          const isDoubleTap =
            now - lastTapTime > 0 && now - lastTapTime < 340 && nearPreviousTap;

          if (isDoubleTap && activeTouchPoints.size <= 1) {
            tryStartTravelToScreenPoint(
              pointerGesture.latestX,
              pointerGesture.latestY,
            );
          }

          lastTapTime = now;
          lastTapX = pointerGesture.latestX;
          lastTapY = pointerGesture.latestY;
        }

        pointerGesture.active = false;
        pointerGesture.pointerId = null;
      }

      if (event.pointerType !== "touch") {
        return;
      }

      activeTouchPoints.delete(event.pointerId);
      stopTwoFingerVerticalIfNeeded();
    };

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 3);
    dirLight1.position.set(1, 1, 1);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x002288, 3);
    dirLight2.position.set(-1, -1, -1);
    scene.add(dirLight2);

    const ambientLight = new THREE.AmbientLight(0x555555);
    scene.add(ambientLight);

    const loadSampleModel = (candidateIndex = 0, retryAttempt = 0) => {
      if (candidateIndex >= sampleGlbCandidates.length) {
        return;
      }

      const baseGlbUrl = sampleGlbCandidates[candidateIndex];
      const sampleGlbUrl =
        retryAttempt > 0
          ? `${baseGlbUrl}${baseGlbUrl.includes("?") ? "&" : "?"}retry=${retryAttempt}`
          : baseGlbUrl;

      gltfLoader.load(
        sampleGlbUrl,
        (gltf) => {
          const model = gltf.scene;
          loadedModel = model;

          model.traverse((node) => {
            if (!node.isMesh) {
              return;
            }

            if (!node.material) {
              return;
            }

            if (Array.isArray(node.material)) {
              node.material.forEach((materialItem) => {
                materialItem.side = THREE.DoubleSide;
                materialItem.needsUpdate = true;
              });
              return;
            }

            node.material.side = THREE.DoubleSide;
            node.material.needsUpdate = true;
          });

          const modelBox = new THREE.Box3().setFromObject(model);
          const modelSize = new THREE.Vector3();
          modelBox.getSize(modelSize);

          if (modelSize.y > 0) {
            const scaleFactor = targetModelHeight / modelSize.y;
            model.scale.setScalar(scaleFactor);
          }

          model.updateMatrixWorld(true);
          modelBox.setFromObject(model);

          const modelCenter = new THREE.Vector3();
          modelBox.getCenter(modelCenter);

          model.position.x -= modelCenter.x;
          model.position.z -= modelCenter.z;
          model.position.y -= modelBox.min.y;

          scene.add(model);
          model.updateMatrixWorld(true);

          const finalBox = new THREE.Box3().setFromObject(model);
          const finalCenter = new THREE.Vector3();
          const finalSize = new THREE.Vector3();
          const finalSphere = new THREE.Sphere();
          finalBox.getCenter(finalCenter);
          finalBox.getSize(finalSize);
          finalBox.getBoundingSphere(finalSphere);

          const radius = Math.max(finalSphere.radius, 1);
          const distance = radius * 2.2;
          const viewDirection = new THREE.Vector3(1, 0.7, 1).normalize();
          const cameraPosition = finalCenter
            .clone()
            .add(viewDirection.multiplyScalar(distance));

          camera.position.copy(cameraPosition);
          camera.near = 0.1;
          camera.far = Math.max(5000, distance * 40);
          camera.updateProjectionMatrix();

          controls.target.copy(finalCenter);
          controls.minDistance = Math.max(0.5, radius * 0.02);
          controls.maxDistance = Math.max(100, radius * 1);
          camera.lookAt(finalCenter);
          controls.update();
        },
        undefined,
        (error) => {
          const statusCode = Number(error?.target?.status || 0);
          const isGatewayError = statusCode === 502;
          const canRetry = retryAttempt < GLB_MAX_RETRIES;

          if (isGatewayError && canRetry) {
            const nextAttempt = retryAttempt + 1;
            pushDebugMessage(
              `502 on GLB, retry ${nextAttempt}/${GLB_MAX_RETRIES}`,
            );
            window.setTimeout(() => {
              loadSampleModel(candidateIndex, nextAttempt);
            }, GLB_RETRY_DELAY_MS * nextAttempt);
            return;
          }

          if (candidateIndex < sampleGlbCandidates.length - 1) {
            loadSampleModel(candidateIndex + 1);
          }
        },
      );
    };

    loadSampleModel();

    let prevTime = performance.now();

    const onWindowResize = () => {
      if (!containerRef.current) {
        return;
      }
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const animate = () => {
      const time = performance.now();
      const delta = (time - prevTime) / 1000;

      if (smoothTravel.active) {
        const t = Math.min(
          (time - smoothTravel.startTime) / smoothTravel.duration,
          1,
        );
        const eased = t * (2 - t);
        const nextTarget = smoothTravel.startTarget
          .clone()
          .lerp(smoothTravel.endTarget, eased);
        const travelDelta = nextTarget.sub(controls.target);

        if (travelDelta.lengthSq() > 0) {
          controls.target.add(travelDelta);
          camera.position.add(travelDelta);
        }

        if (t >= 1) {
          smoothTravel.active = false;
        }
      }

      if (verticalMotion.moveUp && !verticalMotion.moveDown) {
        verticalMotion.velocity += verticalMotion.acceleration * delta;
      } else if (verticalMotion.moveDown && !verticalMotion.moveUp) {
        verticalMotion.velocity -= verticalMotion.acceleration * delta;
      } else {
        verticalMotion.velocity -=
          verticalMotion.velocity * Math.min(1, verticalMotion.damping * delta);
      }

      verticalMotion.velocity = THREE.MathUtils.clamp(
        verticalMotion.velocity,
        -verticalMotion.maxSpeed,
        verticalMotion.maxSpeed,
      );

      const verticalDelta = verticalMotion.velocity * delta;
      if (verticalDelta !== 0) {
        camera.position.y += verticalDelta;
        controls.target.y += verticalDelta;
      }

      controls.update();
      renderer.render(scene, camera);
      prevTime = time;
    };

    renderer.setAnimationLoop(animate);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    renderer.domElement.addEventListener("pointerdown", onPointerDown, {
      passive: true,
    });
    renderer.domElement.addEventListener("pointermove", onPointerMove, {
      passive: false,
    });
    renderer.domElement.addEventListener("pointerup", onPointerEnd, {
      passive: true,
    });
    renderer.domElement.addEventListener("pointercancel", onPointerEnd, {
      passive: true,
    });
    window.addEventListener("resize", onWindowResize);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerEnd);
      renderer.domElement.removeEventListener("pointercancel", onPointerEnd);
      window.removeEventListener("resize", onWindowResize);
      renderer.setAnimationLoop(null);
      controls.dispose();
      if (loadedModel) {
        scene.remove(loadedModel);
      }
      if (overrideMaterial) {
        overrideMaterial.dispose();
      }
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return React.createElement("div", {
    ref: containerRef,
    style: { width: "100%", height: "100%", position: "relative" },
  });
}

export default Controls_Orbit;
