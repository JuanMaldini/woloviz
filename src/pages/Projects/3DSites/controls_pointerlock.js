import React, { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import LoaderViewer from "./components/LoaderViewer";
import {
  createOverwriteMaterialController,
  createOverwriteToggleHandler,
} from "./components/OverwriteMaterial";
import { createScreenshotRequestHandler } from "./components/Screenshot";
import MenuModal, {
  FloatingMenuToggle,
  useMenuPauseController,
} from "./components/menu-modal";

const PLAYER_GROUND_Y = 10;
const MODEL_POSITION_OFFSET = new THREE.Vector3(0, 0.75, 0);
const PLAYER_COLLIDER_RADIUS = 1.2;
const PLAYER_COLLIDER_CENTER_Y_OFFSET =
  PLAYER_GROUND_Y - PLAYER_COLLIDER_RADIUS;
const PLAYER_STEP_HEIGHT = 0.8;
const COLLISION_MIN_HEIGHT = 1.0;
const COLLISION_MAX_WALKABLE_THICKNESS = 1.2;
const COLLISION_MAX_OBSTACLE_SPAN = 28;
const ENABLE_MODEL_COLLISIONS = true;
const LOOK_MAX_DELTA_PER_EVENT = 35;
const PLAYER_SPEED_MULTIPLY = 0.5;
const PLAYER_LOOK_MULTIPLY = 0.5;
const GLB_MAX_RETRIES = 2;
const GLB_RETRY_DELAY_MS = 700;
const NOISELESS_GLB_URL = "/projects/Noiseless/noiseless.glb";

const toNormalizedDirectionVector = (direction) => {
  const vector = new THREE.Vector3(
    Number(direction?.x || 0),
    Number(direction?.y || 0),
    Number(direction?.z || -1),
  );

  if (vector.lengthSq() < 1e-6) {
    return new THREE.Vector3(0, 0, -1);
  }

  return vector.normalize();
};

const toDirectionFromRotation = (rotation) => {
  const euler = new THREE.Euler(
    Number(rotation?.x || 0),
    Number(rotation?.y || 0),
    Number(rotation?.z || 0),
    "YXZ",
  );

  return new THREE.Vector3(0, 0, -1).applyEuler(euler).normalize();
};

const DEFAULT_POINTERLOCK_CAROUSEL_ITEMS = [
  {
    title: "1",
    position: { x: 40, y: PLAYER_GROUND_Y, z: -25 },
    rotation: { x: -0.087, y: 2.094, z: 0 },
  },
  {
    title: "2",
    position: { x: -5.986, y: 10, z: 22.844 },
    rotation: { x: -0.161, y: -0.679, z: 0 },
  },
  {
    title: "3",
    position: { x: -13.657, y: 10, z: 20.92 },
    rotation: { x: -0.291, y: 1.067, z: 0 },
  },
  {
    title: "4",
    position: { x: 42.069, y: 10, z: 15.819 },
    rotation: { x: -0.501, y: 0.951, z: 0 },
  },
];

const INITIAL_POINTERLOCK_ITEM = DEFAULT_POINTERLOCK_CAROUSEL_ITEMS[0] ?? {};
const INITIAL_POINTERLOCK_POSITION = new THREE.Vector3(
  Number(INITIAL_POINTERLOCK_ITEM.position?.x || 0),
  Number(INITIAL_POINTERLOCK_ITEM.position?.y || PLAYER_GROUND_Y),
  Number(INITIAL_POINTERLOCK_ITEM.position?.z || 0),
);
const INITIAL_POINTERLOCK_ROTATION = {
  x: Number(INITIAL_POINTERLOCK_ITEM.rotation?.x || 0),
  y: Number(INITIAL_POINTERLOCK_ITEM.rotation?.y || 0),
  z: Number(INITIAL_POINTERLOCK_ITEM.rotation?.z || 0),
};

function Controls_PointerLock() {
  const containerRef = useRef(null);
  const overwriteMaterialControllerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const handleActiveSlideChangeRef = useRef(() => {});
  const [overwriteEnabled, setOverwriteEnabled] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelLoadError, setModelLoadError] = useState(false);
  const [loadedBytes, setLoadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const overwriteEnabledRef = useRef(false);
  const {
    isVisible: menuVisible,
    isVisibleRef: menuVisibleRef,
    requestPause,
    requestResume,
    requestClose,
  } = useMenuPauseController({ initialVisible: true });

  const handleOpenMenu = useCallback(
    (event) => {
      if (event?.preventDefault) {
        event.preventDefault();
      }
      if (event?.stopPropagation) {
        event.stopPropagation();
      }

      if (
        document.pointerLockElement &&
        typeof document.exitPointerLock === "function"
      ) {
        document.exitPointerLock();
      }

      requestPause();
    },
    [requestPause],
  );

  const handleActiveSlideChange = useCallback(({ slide }) => {
    handleActiveSlideChangeRef.current({ slide });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const isTouchDevice =
      window.matchMedia("(pointer: coarse)").matches ||
      navigator.maxTouchPoints > 0;
    const canUsePointerLock =
      typeof document.body.requestPointerLock === "function" && !isTouchDevice;
    const playerSpeedMultiply = THREE.MathUtils.clamp(
      PLAYER_SPEED_MULTIPLY,
      0,
      1,
    );
    const playerLookMultiply = THREE.MathUtils.clamp(
      PLAYER_LOOK_MULTIPLY,
      0,
      1,
    );
    let touchNavigationStarted = false;

    if (!container) {
      return undefined;
    }

    let camera;
    let scene;
    let renderer;
    let controls;
    let raycaster;
    let loadedModel = null;
    let isDisposed = false;

    const objects = [];
    const obstacleBoxes = [];
    const showLegacyScene = false;
    let moveForward = false;
    let moveBackward = false;
    let moveLeft = false;
    let moveRight = false;

    let prevTime = performance.now();
    const velocity = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const vertex = new THREE.Vector3();
    const color = new THREE.Color();
    const previousPosition = new THREE.Vector3();
    const playerCollider = new THREE.Sphere(
      new THREE.Vector3(),
      PLAYER_COLLIDER_RADIUS,
    );
    const setPlayerColliderCenter = (x, y, z) => {
      playerCollider.center.set(x, y - PLAYER_COLLIDER_CENTER_Y_OFFSET, z);
    };
    const isCollidingLaterally = () => {
      setPlayerColliderCenter(
        controls.object.position.x,
        controls.object.position.y,
        controls.object.position.z,
      );

      return obstacleBoxes.some((obstacle) =>
        obstacle.intersectsSphere(playerCollider),
      );
    };

    const disposableMaterials = [];
    const disposableGeometries = [];
    const gltfLoader = new GLTFLoader();
    const sampleGlbCandidates = [NOISELESS_GLB_URL];
    const targetModelHeight = 42;
    const tapRaycaster = new THREE.Raycaster();
    const navigationPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const tapPointer = new THREE.Vector2();
    const tapPoint = new THREE.Vector3();
    const mobileTeleport = {
      active: false,
      startX: 0,
      startZ: 0,
      endX: 0,
      endZ: 0,
      startTime: 0,
      duration: 450,
    };
    const touchLook = {
      active: false,
      pointerId: null,
      lastX: 0,
      lastY: 0,
      sensitivity: 0.003,
      maxPitch: Math.PI / 2 - 0.05,
    };
    const lookEuler = new THREE.Euler(0, 0, 0, "YXZ");
    const lookRotationMatrix = new THREE.Matrix4();
    let lastTapTime = 0;
    let lastTapX = 0;
    let lastTapY = 0;
    const lookSensitivity = touchLook.sensitivity * playerLookMultiply;
    const smoothSlidePose = {
      active: false,
      startTime: 0,
      duration: 620,
      startPosition: new THREE.Vector3(),
      endPosition: new THREE.Vector3(),
      startQuaternion: new THREE.Quaternion(),
      endQuaternion: new THREE.Quaternion(),
    };

    handleActiveSlideChangeRef.current = ({ slide }) => {
      if (!slide?.position || (!slide?.rotation && !slide?.direction)) {
        return;
      }

      const directionVector = slide.rotation
        ? toDirectionFromRotation(slide.rotation)
        : toNormalizedDirectionVector(slide.direction);
      const nextPosition = new THREE.Vector3(
        Number(slide.position.x || 0),
        Number(slide.position.y || PLAYER_GROUND_Y),
        Number(slide.position.z || 0),
      );

      lookRotationMatrix.lookAt(
        new THREE.Vector3(0, 0, 0),
        directionVector,
        new THREE.Vector3(0, 1, 0),
      );

      const nextQuaternion = new THREE.Quaternion().setFromRotationMatrix(
        lookRotationMatrix,
      );

      velocity.set(0, 0, 0);
      mobileTeleport.active = false;
      smoothSlidePose.startPosition.copy(controls.object.position);
      smoothSlidePose.endPosition.copy(nextPosition);
      smoothSlidePose.startQuaternion.copy(camera.quaternion);
      smoothSlidePose.endQuaternion.copy(nextQuaternion);
      smoothSlidePose.startTime = performance.now();
      smoothSlidePose.active = true;
    };

    const applyLookDelta = (deltaX, deltaY) => {
      lookEuler.setFromQuaternion(camera.quaternion);
      lookEuler.y -= deltaX * lookSensitivity;
      lookEuler.x -= deltaY * lookSensitivity;
      lookEuler.x = THREE.MathUtils.clamp(
        lookEuler.x,
        -touchLook.maxPitch,
        touchLook.maxPitch,
      );
      lookEuler.z = 0;
      camera.quaternion.setFromEuler(lookEuler);
    };

    const onMouseMoveLocked = (event) => {
      if (!controls || !controls.isLocked) {
        return;
      }

      const deltaX = THREE.MathUtils.clamp(
        event.movementX || 0,
        -LOOK_MAX_DELTA_PER_EVENT,
        LOOK_MAX_DELTA_PER_EVENT,
      );
      const deltaY = THREE.MathUtils.clamp(
        event.movementY || 0,
        -LOOK_MAX_DELTA_PER_EVENT,
        LOOK_MAX_DELTA_PER_EVENT,
      );

      applyLookDelta(deltaX, deltaY);
    };

    const isPointBlocked = (x, y, z) => {
      setPlayerColliderCenter(x, y, z);
      return obstacleBoxes.some((obstacle) =>
        obstacle.intersectsSphere(playerCollider),
      );
    };

    const startSmoothTeleport = (targetX, targetZ) => {
      const currentY = controls.object.position.y;

      if (isPointBlocked(targetX, currentY, targetZ)) {
        return;
      }

      mobileTeleport.active = true;
      mobileTeleport.startX = controls.object.position.x;
      mobileTeleport.startZ = controls.object.position.z;
      mobileTeleport.endX = targetX;
      mobileTeleport.endZ = targetZ;
      mobileTeleport.startTime = performance.now();
      velocity.x = 0;
      velocity.z = 0;
    };

    const tryStepUp = () => {
      if (velocity.y > 0) {
        return false;
      }

      const originalY = controls.object.position.y;
      controls.object.position.y = originalY + PLAYER_STEP_HEIGHT;

      if (isCollidingLaterally()) {
        controls.object.position.y = originalY;
        return false;
      }

      velocity.y = 0;
      return true;
    };

    const shouldRegisterObstacle = (box) => {
      if (!box || box.isEmpty()) {
        return false;
      }

      const size = new THREE.Vector3();
      box.getSize(size);

      const looksLikeEnclosingHull =
        size.x > COLLISION_MAX_OBSTACLE_SPAN ||
        size.z > COLLISION_MAX_OBSTACLE_SPAN;

      if (looksLikeEnclosingHull) {
        return false;
      }

      const looksLikeFlatWalkableSurface =
        size.y <= COLLISION_MAX_WALKABLE_THICKNESS &&
        size.x > size.y * 4 &&
        size.z > size.y * 4;

      if (looksLikeFlatWalkableSurface) {
        return false;
      }

      if (size.y < COLLISION_MIN_HEIGHT) {
        return false;
      }

      const spawnColliderCenter = new THREE.Vector3(
        INITIAL_POINTERLOCK_POSITION.x,
        INITIAL_POINTERLOCK_POSITION.y - PLAYER_COLLIDER_CENTER_Y_OFFSET,
        INITIAL_POINTERLOCK_POSITION.z,
      );
      const closestToSpawn = box.clampPoint(
        spawnColliderCenter,
        new THREE.Vector3(),
      );
      const spawnTouchesObstacle =
        closestToSpawn.distanceTo(spawnColliderCenter) <=
        PLAYER_COLLIDER_RADIUS + 0.15;

      if (spawnTouchesObstacle) {
        return false;
      }

      return true;
    };

    const onPointerDown = (event) => {
      if (!controls.isLocked && canUsePointerLock) {
        if (menuVisibleRef.current) {
          return;
        }

        try {
          const result = controls.lock();
          if (result && typeof result.catch === "function") {
            result.catch(() => {});
          }
        } catch {
          // Ignore lock errors; unlock event handles UI state.
        }
        return;
      }

      if (!controls.isLocked && !touchNavigationStarted) {
        if (!canUsePointerLock && !menuVisibleRef.current) {
          touchNavigationStarted = true;
        } else {
          return;
        }
      }

      if (menuVisibleRef.current) {
        return;
      }

      if (touchNavigationStarted && event.pointerType === "touch") {
        touchLook.active = true;
        touchLook.pointerId = event.pointerId;
        touchLook.lastX = event.clientX;
        touchLook.lastY = event.clientY;
      }

      const now = performance.now();
      const elapsed = now - lastTapTime;
      const dx = event.clientX - lastTapX;
      const dy = event.clientY - lastTapY;
      const isNear = dx * dx + dy * dy <= 32 * 32;
      const isDoubleTap = elapsed > 0 && elapsed < 320 && isNear;

      lastTapTime = now;
      lastTapX = event.clientX;
      lastTapY = event.clientY;

      if (!isDoubleTap) {
        return;
      }

      const rect = renderer.domElement.getBoundingClientRect();
      tapPointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      tapPointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      tapRaycaster.setFromCamera(tapPointer, camera);

      if (tapRaycaster.ray.intersectPlane(navigationPlane, tapPoint)) {
        startSmoothTeleport(tapPoint.x, tapPoint.z);
      }
    };

    const onPointerMove = (event) => {
      if (!touchLook.active || touchLook.pointerId !== event.pointerId) {
        return;
      }

      const dx = event.clientX - touchLook.lastX;
      const dy = event.clientY - touchLook.lastY;
      touchLook.lastX = event.clientX;
      touchLook.lastY = event.clientY;
      applyLookDelta(dx, dy);
    };

    const stopTouchLook = (event) => {
      if (
        touchLook.pointerId !== null &&
        touchLook.pointerId !== event.pointerId
      ) {
        return;
      }
      touchLook.active = false;
      touchLook.pointerId = null;
    };

    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      1,
      1000,
    );
    cameraRef.current = camera;
    camera.position.copy(INITIAL_POINTERLOCK_POSITION);

    scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xffffff);
    scene.fog = new THREE.Fog(0xffffff, 0, 750);
    const overwriteMaterialController = createOverwriteMaterialController();
    overwriteMaterialControllerRef.current = overwriteMaterialController;
    overwriteMaterialController.setScene(scene);
    overwriteMaterialController.setEnabled(overwriteEnabledRef.current);

    const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 2.5);
    light.position.set(0.5, 1, 0.75);
    scene.add(light);

    controls = new PointerLockControls(camera, document.body);
    controls.pointerSpeed = 0;

    const onLock = () => {
      requestResume();
    };

    const onUnlock = () => {
      requestPause();
    };

    controls.addEventListener("lock", onLock);
    controls.addEventListener("unlock", onUnlock);

    scene.add(controls.object);
    controls.object.position.copy(INITIAL_POINTERLOCK_POSITION);
    camera.rotation.order = "YXZ";
    controls.object.rotation.order = "YXZ";
    lookEuler.set(
      INITIAL_POINTERLOCK_ROTATION.x,
      INITIAL_POINTERLOCK_ROTATION.y,
      INITIAL_POINTERLOCK_ROTATION.z,
      "YXZ",
    );
    camera.quaternion.setFromEuler(lookEuler);

    const onKeyDown = (event) => {
      switch (event.code) {
        case "ArrowUp":
        case "KeyW":
          moveForward = true;
          break;
        case "ArrowLeft":
        case "KeyA":
          moveLeft = true;
          break;
        case "ArrowDown":
        case "KeyS":
          moveBackward = true;
          break;
        case "ArrowRight":
        case "KeyD":
          moveRight = true;
          break;
        default:
          break;
      }
    };

    const onKeyUp = (event) => {
      switch (event.code) {
        case "ArrowUp":
        case "KeyW":
          moveForward = false;
          break;
        case "ArrowLeft":
        case "KeyA":
          moveLeft = false;
          break;
        case "ArrowDown":
        case "KeyS":
          moveBackward = false;
          break;
        case "ArrowRight":
        case "KeyD":
          moveRight = false;
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    document.addEventListener("mousemove", onMouseMoveLocked);

    raycaster = new THREE.Raycaster(
      new THREE.Vector3(),
      new THREE.Vector3(0, -1, 0),
      0,
      10,
    );

    if (showLegacyScene) {
      let floorGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
      floorGeometry.rotateX(-Math.PI / 2);

      let position = floorGeometry.attributes.position;

      for (let index = 0, length = position.count; index < length; index += 1) {
        vertex.fromBufferAttribute(position, index);
        vertex.x += Math.random() * 20 - 10;
        vertex.y += Math.random() * 2;
        vertex.z += Math.random() * 20 - 10;
        position.setXYZ(index, vertex.x, vertex.y, vertex.z);
      }

      floorGeometry = floorGeometry.toNonIndexed();
      position = floorGeometry.attributes.position;

      const colorsFloor = [];
      for (let index = 0, length = position.count; index < length; index += 1) {
        color.setHSL(
          Math.random() * 0.3 + 0.5,
          0.75,
          Math.random() * 0.25 + 0.75,
          THREE.SRGBColorSpace,
        );
        colorsFloor.push(color.r, color.g, color.b);
      }

      floorGeometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(colorsFloor, 3),
      );
      disposableGeometries.push(floorGeometry);

      const floorMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });
      disposableMaterials.push(floorMaterial);

      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      scene.add(floor);

      const boxGeometry = new THREE.BoxGeometry(20, 20, 20).toNonIndexed();
      disposableGeometries.push(boxGeometry);
      position = boxGeometry.attributes.position;

      const colorsBox = [];
      for (let index = 0, length = position.count; index < length; index += 1) {
        color.setHSL(
          Math.random() * 0.3 + 0.5,
          0.75,
          Math.random() * 0.25 + 0.75,
          THREE.SRGBColorSpace,
        );
        colorsBox.push(color.r, color.g, color.b);
      }
      boxGeometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(colorsBox, 3),
      );

      for (let index = 0; index < 500; index += 1) {
        const boxMaterial = new THREE.MeshPhongMaterial({
          specular: 0xffffff,
          flatShading: true,
          vertexColors: true,
        });
        boxMaterial.color.setHSL(
          Math.random() * 0.2 + 0.5,
          0.75,
          Math.random() * 0.25 + 0.75,
          THREE.SRGBColorSpace,
        );
        disposableMaterials.push(boxMaterial);

        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.x = Math.floor(Math.random() * 20 - 10) * 20;
        box.position.y = Math.floor(Math.random() * 20) * 20 + 10;
        box.position.z = Math.floor(Math.random() * 20 - 10) * 20;

        scene.add(box);
        objects.push(box);
        obstacleBoxes.push(
          new THREE.Box3().setFromCenterAndSize(
            box.position.clone(),
            new THREE.Vector3(20, 20, 20),
          ),
        );
      }
    }

    const loadWalkableModel = (candidateIndex = 0, retryAttempt = 0) => {
      if (candidateIndex >= sampleGlbCandidates.length) {
        if (!isDisposed) {
          setIsModelLoading(false);
          setModelLoadError(true);
        }
        return;
      }

      if (!isDisposed) {
        setIsModelLoading(true);
        setModelLoadError(false);
        setLoadedBytes(0);
        setTotalBytes(0);
      }

      const baseGlbUrl = sampleGlbCandidates[candidateIndex];
      const requestUrl =
        retryAttempt > 0
          ? `${baseGlbUrl}${baseGlbUrl.includes("?") ? "&" : "?"}retry=${retryAttempt}`
          : baseGlbUrl;

      gltfLoader.load(
        requestUrl,
        (gltf) => {
          if (isDisposed) {
            return;
          }

          const model = gltf.scene;
          loadedModel = model;

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
          model.position.add(MODEL_POSITION_OFFSET);

          scene.add(model);
          model.updateMatrixWorld(true);
          obstacleBoxes.length = showLegacyScene ? obstacleBoxes.length : 0;

          if (ENABLE_MODEL_COLLISIONS) {
            model.traverse((node) => {
              if (!node.isMesh) {
                return;
              }

              if (node.geometry) {
                const box = new THREE.Box3().setFromObject(node);
                if (shouldRegisterObstacle(box)) {
                  obstacleBoxes.push(box);
                }
              }
            });
          }

          setIsModelLoading(false);
          setModelLoadError(false);
        },
        (event) => {
          if (isDisposed) {
            return;
          }

          const nextLoaded = Number(event?.loaded || 0);
          const nextTotal = Number(event?.total || 0);
          setLoadedBytes(nextLoaded);
          setTotalBytes(nextTotal > 0 ? nextTotal : 0);
        },
        (error) => {
          if (isDisposed) {
            return;
          }

          const statusCode = Number(error?.target?.status || 0);
          const isGatewayError = statusCode === 502;
          const canRetry = retryAttempt < GLB_MAX_RETRIES;

          if (isGatewayError && canRetry) {
            const nextAttempt = retryAttempt + 1;
            window.setTimeout(() => {
              loadWalkableModel(candidateIndex, nextAttempt);
            }, GLB_RETRY_DELAY_MS * nextAttempt);

            return;
          }

          if (candidateIndex < sampleGlbCandidates.length - 1) {
            loadWalkableModel(candidateIndex + 1);
            return;
          }

          setIsModelLoading(false);
          setModelLoadError(true);
        },
      );
    };

    loadWalkableModel();

    renderer = new THREE.WebGLRenderer({
      antialias: !isTouchDevice,
      preserveDrawingBuffer: true,
    });
    rendererRef.current = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(() => {
      const time = performance.now();

      if (mobileTeleport.active) {
        const t = Math.min(
          (time - mobileTeleport.startTime) / mobileTeleport.duration,
          1,
        );
        const eased = t * (2 - t);
        const nextX = THREE.MathUtils.lerp(
          mobileTeleport.startX,
          mobileTeleport.endX,
          eased,
        );
        const nextZ = THREE.MathUtils.lerp(
          mobileTeleport.startZ,
          mobileTeleport.endZ,
          eased,
        );
        const currentY = controls.object.position.y;

        if (isPointBlocked(nextX, currentY, nextZ)) {
          mobileTeleport.active = false;
        } else {
          controls.object.position.x = nextX;
          controls.object.position.z = nextZ;
          if (t >= 1) {
            mobileTeleport.active = false;
          }
        }
      }

      if (smoothSlidePose.active) {
        const t = Math.min(
          (time - smoothSlidePose.startTime) / smoothSlidePose.duration,
          1,
        );
        const eased = t * (2 - t);

        controls.object.position.lerpVectors(
          smoothSlidePose.startPosition,
          smoothSlidePose.endPosition,
          eased,
        );
        camera.quaternion.slerpQuaternions(
          smoothSlidePose.startQuaternion,
          smoothSlidePose.endQuaternion,
          eased,
        );
        lookEuler.setFromQuaternion(camera.quaternion);

        if (t >= 1) {
          smoothSlidePose.active = false;
        }
      }

      if (controls.isLocked || touchNavigationStarted) {
        raycaster.ray.origin.copy(controls.object.position);
        raycaster.ray.origin.y -= 10;

        const intersections = raycaster.intersectObjects(objects, false);
        const onObject = intersections.length > 0;

        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 100.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) {
          velocity.z -= direction.z * (400.0 * playerSpeedMultiply) * delta;
        }
        if (moveLeft || moveRight) {
          velocity.x -= direction.x * (400.0 * playerSpeedMultiply) * delta;
        }

        if (onObject) {
          velocity.y = Math.max(0, velocity.y);
        }

        const moveRightDelta = -velocity.x * delta;
        const moveForwardDelta = -velocity.z * delta;

        if (moveRightDelta !== 0) {
          previousPosition.copy(controls.object.position);
          controls.moveRight(moveRightDelta);

          if (isCollidingLaterally()) {
            const stepped = tryStepUp();
            if (!stepped) {
              controls.object.position.x = previousPosition.x;
              controls.object.position.z = previousPosition.z;
              controls.object.position.y = previousPosition.y;
              velocity.x = 0;
            }
          }
        }

        if (moveForwardDelta !== 0) {
          previousPosition.copy(controls.object.position);
          controls.moveForward(moveForwardDelta);

          if (isCollidingLaterally()) {
            const stepped = tryStepUp();
            if (!stepped) {
              controls.object.position.x = previousPosition.x;
              controls.object.position.z = previousPosition.z;
              controls.object.position.y = previousPosition.y;
              velocity.z = 0;
            }
          }
        }

        controls.object.position.y += velocity.y * delta;

        if (controls.object.position.y < PLAYER_GROUND_Y) {
          velocity.y = 0;
          controls.object.position.y = PLAYER_GROUND_Y;
        }
      }

      prevTime = time;
      renderer.render(scene, camera);
    });

    container.appendChild(renderer.domElement);
    container.addEventListener("pointerdown", onPointerDown, { passive: true });
    container.addEventListener("pointermove", onPointerMove, { passive: true });
    container.addEventListener("pointerup", stopTouchLook, { passive: true });
    container.addEventListener("pointercancel", stopTouchLook, {
      passive: true,
    });

    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", onWindowResize);

    return () => {
      isDisposed = true;
      window.removeEventListener("resize", onWindowResize);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", stopTouchLook);
      container.removeEventListener("pointercancel", stopTouchLook);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("mousemove", onMouseMoveLocked);
      controls.removeEventListener("lock", onLock);
      controls.removeEventListener("unlock", onUnlock);

      controls.unlock();
      renderer.setAnimationLoop(null);

      if (loadedModel) {
        scene.remove(loadedModel);
      }

      overwriteMaterialController.dispose();
      overwriteMaterialControllerRef.current = null;
      handleActiveSlideChangeRef.current = () => {};
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;

      disposableGeometries.forEach((geometry) => geometry.dispose());
      disposableMaterials.forEach((material) => material.dispose());
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleRequestScreenshot = createScreenshotRequestHandler({
    rendererRef,
    sceneRef,
    cameraRef,
  });

  const handleToggleOverwrite = createOverwriteToggleHandler({
    overwriteEnabledRef,
    setOverwriteEnabled,
    overwriteMaterialControllerRef,
  });

  return React.createElement(
    "div",
    {
      ref: containerRef,
      style: {
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        touchAction: "none",
      },
    },
    React.createElement(FloatingMenuToggle, {
      visible: !menuVisible,
      isOpen: menuVisible,
      onToggle: handleOpenMenu,
      ariaLabel: "Open menu",
    }),
    React.createElement(LoaderViewer, {
      visible: isModelLoading || modelLoadError,
      loadedBytes,
      totalBytes,
      hasError: modelLoadError,
    }),
    React.createElement(MenuModal, {
      visible: menuVisible,
      carouselPositions: DEFAULT_POINTERLOCK_CAROUSEL_ITEMS,
      onClose: requestClose,
      overwriteEnabled,
      onActiveSlideChange: handleActiveSlideChange,
      onRequestScreenshot: handleRequestScreenshot,
      onToggleOverwrite: handleToggleOverwrite,
    }),
  );
}

export default Controls_PointerLock;
