import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

function Controls_PointerLock() {
  const containerRef = useRef(null);
  const blockerRef = useRef(null);
  const instructionsRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const blocker = blockerRef.current;
    const instructions = instructionsRef.current;
    const isTouchDevice =
      window.matchMedia("(pointer: coarse)").matches ||
      navigator.maxTouchPoints > 0;
    const canUsePointerLock =
      typeof document.body.requestPointerLock === "function" && !isTouchDevice;
    let touchNavigationStarted = false;

    if (!container || !blocker || !instructions) {
      return undefined;
    }

    let camera;
    let scene;
    let renderer;
    let controls;
    let raycaster;
    let loadedModel = null;

    const objects = [];
    const obstacleBoxes = [];
    const showLegacyScene = false;
    let moveForward = false;
    let moveBackward = false;
    let moveLeft = false;
    let moveRight = false;
    let canJump = false;

    let prevTime = performance.now();
    const velocity = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const vertex = new THREE.Vector3();
    const color = new THREE.Color();
    const previousPosition = new THREE.Vector3();
    const playerCollider = new THREE.Sphere(new THREE.Vector3(), 4);
    const isCollidingLaterally = () => {
      playerCollider.center.set(
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
    const sampleGlbUrl = new URL("./sample.glb", import.meta.url).href;
    const targetModelHeight = 24;
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
      yaw: 0,
      pitch: 0,
      sensitivity: 0.003,
      maxPitch: Math.PI / 2 - 0.05,
    };
    let lastTapTime = 0;
    let lastTapX = 0;
    let lastTapY = 0;

    const isPointBlocked = (x, y, z) => {
      playerCollider.center.set(x, y, z);
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

    const onPointerDown = (event) => {
      if (!controls.isLocked && !touchNavigationStarted) {
        return;
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
        return;
      }

      if (touchNavigationStarted && event.pointerType === "touch") {
        touchLook.active = true;
        touchLook.pointerId = event.pointerId;
        touchLook.lastX = event.clientX;
        touchLook.lastY = event.clientY;
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

      touchLook.yaw -= dx * touchLook.sensitivity;
      touchLook.pitch -= dy * touchLook.sensitivity;
      touchLook.pitch = THREE.MathUtils.clamp(
        touchLook.pitch,
        -touchLook.maxPitch,
        touchLook.maxPitch,
      );

      controls.object.rotation.y = touchLook.yaw;
      camera.rotation.x = touchLook.pitch;
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
    camera.position.y = 10;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    scene.fog = new THREE.Fog(0xffffff, 0, 750);

    const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 2.5);
    light.position.set(0.5, 1, 0.75);
    scene.add(light);

    controls = new PointerLockControls(camera, document.body);

    const onInstructionsClick = (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (canUsePointerLock) {
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

      touchNavigationStarted = true;
      instructions.style.display = "none";
      blocker.style.display = "none";
    };

    const onLock = () => {
      instructions.style.display = "none";
      blocker.style.display = "none";
    };

    const onUnlock = () => {
      blocker.style.display = "block";
      instructions.style.display = "";
    };

    instructions.addEventListener("click", onInstructionsClick);
    instructions.addEventListener("pointerdown", onInstructionsClick);
    controls.addEventListener("lock", onLock);
    controls.addEventListener("unlock", onUnlock);

    if (!canUsePointerLock) {
      instructions.innerHTML = "Tap to start";
    }

    scene.add(controls.object);
    camera.rotation.order = "YXZ";
    touchLook.yaw = controls.object.rotation.y;
    touchLook.pitch = camera.rotation.x;

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
        case "Space":
          if (canJump) {
            velocity.y += 350;
          }
          canJump = false;
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

    raycaster = new THREE.Raycaster(
      new THREE.Vector3(),
      new THREE.Vector3(0, -1, 0),
      0,
      10,
    );

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
    if (showLegacyScene) {
      scene.add(floor);
    }

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

      if (showLegacyScene) {
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

    gltfLoader.load(
      sampleGlbUrl,
      (gltf) => {
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

        scene.add(model);
        model.updateMatrixWorld(true);

        obstacleBoxes.length = showLegacyScene ? obstacleBoxes.length : 0;

        model.traverse((node) => {
          if (!node.isMesh) {
            return;
          }

          if (node.geometry) {
            const box = new THREE.Box3().setFromObject(node);
            if (!box.isEmpty()) {
              obstacleBoxes.push(box);
            }
          }
        });
      },
      undefined,
      (error) => {
        console.error("Error loading sample.glb", error);
        const message = error instanceof Error ? error.message : String(error);
        if (/Unexpected token|not valid JSON/i.test(message)) {
          console.error(
            "sample.glb parece inválido en deploy (posible puntero de Git LFS en lugar del binario real).",
          );
        }
      },
    );

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
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
          velocity.z -= direction.z * 400.0 * delta;
        }
        if (moveLeft || moveRight) {
          velocity.x -= direction.x * 400.0 * delta;
        }

        if (onObject) {
          velocity.y = Math.max(0, velocity.y);
          canJump = false;
        }

        const moveRightDelta = -velocity.x * delta;
        const moveForwardDelta = -velocity.z * delta;

        if (moveRightDelta !== 0) {
          previousPosition.copy(controls.object.position);
          controls.moveRight(moveRightDelta);

          if (isCollidingLaterally()) {
            controls.object.position.x = previousPosition.x;
            controls.object.position.z = previousPosition.z;
            velocity.x = 0;
          }
        }

        if (moveForwardDelta !== 0) {
          previousPosition.copy(controls.object.position);
          controls.moveForward(moveForwardDelta);

          if (isCollidingLaterally()) {
            controls.object.position.x = previousPosition.x;
            controls.object.position.z = previousPosition.z;
            velocity.z = 0;
          }
        }

        controls.object.position.y += velocity.y * delta;

        if (controls.object.position.y < 10) {
          velocity.y = 0;
          controls.object.position.y = 10;
          canJump = false;
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
      window.removeEventListener("resize", onWindowResize);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", stopTouchLook);
      container.removeEventListener("pointercancel", stopTouchLook);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      instructions.removeEventListener("click", onInstructionsClick);
      instructions.removeEventListener("pointerdown", onInstructionsClick);
      controls.removeEventListener("lock", onLock);
      controls.removeEventListener("unlock", onUnlock);

      controls.unlock();
      renderer.setAnimationLoop(null);

      if (loadedModel) {
        scene.remove(loadedModel);
      }

      disposableGeometries.forEach((geometry) => geometry.dispose());
      disposableMaterials.forEach((material) => material.dispose());
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

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
    React.createElement(
      "div",
      {
        ref: blockerRef,
        style: {
          position: "absolute",
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 10,
        },
      },
      React.createElement(
        "div",
        {
          ref: instructionsRef,
          style: {
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            fontSize: "14px",
            cursor: "pointer",
            color: "#ffffff",
            fontFamily: "Arial, sans-serif",
            userSelect: "none",
          },
        },
        React.createElement(
          "p",
          { style: { fontSize: "36px", margin: 0 } },
          "Click to play",
        ),
        React.createElement(
          "p",
          { style: { marginTop: "12px", marginBottom: 0 } },
          "Move: WASD",
          React.createElement("br"),
          "Jump: SPACE",
          React.createElement("br"),
          "Look: MOUSE",
        ),
      ),
    ),
  );
}

export default Controls_PointerLock;
