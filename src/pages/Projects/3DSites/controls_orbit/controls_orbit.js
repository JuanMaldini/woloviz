import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

function Controls_Orbit() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    let loadedModel = null;
    const gltfLoader = new GLTFLoader();
    const sampleGlbCandidates = [
      new URL("../controls_pointerlock/sample.glb", import.meta.url).href,
    ];
    const targetModelHeight = 24;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcccccc);
    scene.fog = new THREE.FogExp2(0xcccccc, 0.002);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      1,
      1000,
    );
    camera.position.set(400, 200, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
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

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 3);
    dirLight1.position.set(1, 1, 1);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x002288, 3);
    dirLight2.position.set(-1, -1, -1);
    scene.add(dirLight2);

    const ambientLight = new THREE.AmbientLight(0x555555);
    scene.add(ambientLight);

    const loadSampleModel = (candidateIndex = 0) => {
      if (candidateIndex >= sampleGlbCandidates.length) {
        console.error(
          "Error loading sample.glb in orbit view: no valid URL candidate worked",
        );
        return;
      }

      const sampleGlbUrl = sampleGlbCandidates[candidateIndex];
      console.info("[controls_orbit] trying GLB", sampleGlbUrl);

      gltfLoader.load(
        sampleGlbUrl,
        (gltf) => {
          const model = gltf.scene;
          loadedModel = model;

          model.traverse((node) => {
            if (!node.isMesh) {
              return;
            }

            node.frustumCulled = false;

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

          console.info("[controls_orbit] raw model size", {
            x: modelSize.x,
            y: modelSize.y,
            z: modelSize.z,
            children: model.children.length,
          });

          if (modelSize.y > 0) {
            const scaleFactor = targetModelHeight / modelSize.y;
            model.scale.setScalar(scaleFactor);
            console.info("[controls_orbit] applied scale", scaleFactor);
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

          console.info("[controls_orbit] final model transform", {
            position: {
              x: model.position.x,
              y: model.position.y,
              z: model.position.z,
            },
            center: { x: finalCenter.x, y: finalCenter.y, z: finalCenter.z },
            size: { x: finalSize.x, y: finalSize.y, z: finalSize.z },
          });

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
          controls.minDistance = Math.max(0.5, radius * 0.15);
          controls.maxDistance = Math.max(100, radius * 20);
          camera.lookAt(finalCenter);
          controls.update();

          console.info("[controls_orbit] camera/target", {
            camera: {
              x: camera.position.x,
              y: camera.position.y,
              z: camera.position.z,
            },
            target: {
              x: controls.target.x,
              y: controls.target.y,
              z: controls.target.z,
            },
          });
        },
        undefined,
        (error) => {
          if (candidateIndex < sampleGlbCandidates.length - 1) {
            console.warn("[controls_orbit] failed candidate, trying fallback", {
              candidate: sampleGlbUrl,
              error,
            });
            loadSampleModel(candidateIndex + 1);
            return;
          }

          console.error("Error loading sample.glb in orbit view", error);
        },
      );
    };

    loadSampleModel();

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
      controls.update();
      renderer.render(scene, camera);
    };

    renderer.setAnimationLoop(animate);
    window.addEventListener("resize", onWindowResize);

    return () => {
      window.removeEventListener("resize", onWindowResize);
      renderer.setAnimationLoop(null);
      controls.dispose();
      if (loadedModel) {
        scene.remove(loadedModel);
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
