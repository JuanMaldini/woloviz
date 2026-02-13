import { useMemo, useRef, useState } from "react";
import { FaLocationDot } from "react-icons/fa6";
import {
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoContractOutline,
  IoExpandOutline,
  IoPause,
  IoPlay,
} from "react-icons/io5";

//adding fllorplan image
const MarzipanoTopBar = ({
  scenes,
  assetUrls,
  showFloorplan = true,
  floorplanPositions = [],
  enableFloorplanMarkerDrag = false,
}) => {
  const DRAG_START_DISTANCE_PX = 12;
  const floorplanIconSize = 22;
  const stageRef = useRef(null);
  const suppressClickSceneRef = useRef(null);
  const dragRef = useRef({
    active: false,
    pointerId: null,
    sceneId: null,
    startClientX: 0,
    startClientY: 0,
    moved: false,
    target: null,
  });
  const [livePositions, setLivePositions] = useState({});
  const [isFloorplanOpen, setIsFloorplanOpen] = useState(false);

  const normalizePositionValue = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return 0;
    }
    if (numeric >= 0 && numeric <= 1) {
      return Math.min(1, Math.max(0, numeric));
    }
    return Math.min(1, Math.max(0, numeric / 100));
  };

  const toPercentPosition = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return "0%";
    }
    if (numeric >= 0 && numeric <= 1) {
      return `${numeric * 100}%`;
    }
    return `${numeric}%`;
  };

  const positionById = useMemo(
    () =>
      floorplanPositions.reduce((acc, item) => {
        acc[item.id] = {
          x: normalizePositionValue(item.x),
          y: normalizePositionValue(item.y),
        };
        return acc;
      }, {}),
    [floorplanPositions],
  );

  const getMarkerPosition = (sceneId) => {
    return livePositions[sceneId] ?? positionById[sceneId] ?? { x: 0.5, y: 0.5 };
  };

  const updateMarkerByPointer = (sceneId, clientX, clientY) => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const rect = stage.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));

    setLivePositions((prev) => ({
      ...prev,
      [sceneId]: { x, y },
    }));
  };

  const handleMarkerPointerDown = (sceneId, event) => {
    if (!enableFloorplanMarkerDrag) {
      return;
    }
    if (typeof event.button === "number" && event.button !== 0) {
      return;
    }

    const target = event.currentTarget;

    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      sceneId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      moved: false,
      target,
    };

    target?.setPointerCapture?.(event.pointerId);

    const handleWindowPointerMove = (moveEvent) => {
      const drag = dragRef.current;
      if (!drag.active || moveEvent.pointerId !== drag.pointerId) {
        return;
      }

      const movedX = Math.abs(moveEvent.clientX - drag.startClientX);
      const movedY = Math.abs(moveEvent.clientY - drag.startClientY);

      if (!drag.moved) {
        if (
          movedX < DRAG_START_DISTANCE_PX &&
          movedY < DRAG_START_DISTANCE_PX
        ) {
          return;
        }
        drag.moved = true;
        if (drag.target) {
          drag.target.style.cursor = "grabbing";
        }
        document.body.style.cursor = "grabbing";
        document.body.style.userSelect = "none";
      }

      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      updateMarkerByPointer(sceneId, moveEvent.clientX, moveEvent.clientY);
    };

    const finishFromWindow = (endEvent, cancelled = false) => {
      const drag = dragRef.current;
      if (!drag.active || endEvent.pointerId !== drag.pointerId) {
        return;
      }

      window.removeEventListener("pointermove", handleWindowPointerMove, true);
      window.removeEventListener("pointerup", handleWindowPointerUp, true);
      window.removeEventListener(
        "pointercancel",
        handleWindowPointerCancel,
        true,
      );

      if (
        drag.pointerId !== null &&
        drag.target?.hasPointerCapture?.(drag.pointerId)
      ) {
        drag.target.releasePointerCapture(drag.pointerId);
      }

      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      const position = livePositions[sceneId] ?? positionById[sceneId];
      if (!cancelled && drag.moved && position) {
        endEvent.preventDefault();
        endEvent.stopPropagation();
        window.dispatchEvent(
          new CustomEvent("playground:floorplan-position-commit", {
            detail: {
              sceneId,
              x: position.x,
              y: position.y,
            },
          }),
        );
      }

      suppressClickSceneRef.current = drag.moved ? sceneId : null;

      if (drag.target) {
        drag.target.style.cursor = "grab";
      }

      dragRef.current = {
        active: false,
        pointerId: null,
        sceneId: null,
        startClientX: 0,
        startClientY: 0,
        moved: false,
        target: null,
      };
    };

    const handleWindowPointerUp = (upEvent) => {
      finishFromWindow(upEvent, false);
    };

    const handleWindowPointerCancel = (cancelEvent) => {
      finishFromWindow(cancelEvent, true);
    };

    window.addEventListener("pointermove", handleWindowPointerMove, true);
    window.addEventListener("pointerup", handleWindowPointerUp, true);
    window.addEventListener("pointercancel", handleWindowPointerCancel, true);
  };

  const handleMarkerClick = (sceneId, event) => {
    if (!enableFloorplanMarkerDrag) {
      return;
    }
    if (suppressClickSceneRef.current === sceneId) {
      event.preventDefault();
      event.stopPropagation();
      suppressClickSceneRef.current = null;
    }
  };

  const getMarkerInteractionProps = (sceneId) => {
    if (!enableFloorplanMarkerDrag) {
      return {};
    }

    return {
      onPointerDown: (event) => handleMarkerPointerDown(sceneId, event),
      onClickCapture: (event) => {
        handleMarkerClick(sceneId, event);
      },
      style: {
        touchAction: "none",
        cursor: "grab",
      },
    };
  };

  return (
    <>
      <div id="sceneList">
        <ul className="scenes">
          {showFloorplan && (
            <li className="scene-list-close-item">
              <button
                type="button"
                className="scene floor-plan-trigger scene-list-close"
                data-action="close-scene-list"
                aria-label="Cerrar menú"
              >
                <span className="text">Close</span>
              </button>
            </li>
          )}
          {showFloorplan && (
            <li className="floor-plan-item">
              <button
                type="button"
                className="scene floor-plan-trigger"
                onClick={() => setIsFloorplanOpen(true)}
              >
                <span className="text">Floorplan</span>
              </button>
            </li>
          )}
          {scenes.map((scene) => (
            <li key={scene.id}>
              <button type="button" className="scene" data-id={scene.id}>
                <span className="text">{scene.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {showFloorplan && (
        <div
          className={`info-hotspot-modal floor-plan-modal${isFloorplanOpen ? " visible" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label="Floorplan"
        >
          <button
            type="button"
            className="floor-plan-backdrop"
            onClick={() => setIsFloorplanOpen(false)}
            aria-label="Close floor plan"
          />
          <div className="floor-plan-panel">
            <div className="floor-plan-stage" ref={stageRef}>
              <div className="floor-plan-image">
                {assetUrls.floorplan ? (
                  <img src={assetUrls.floorplan} alt="Floorplan" />
                ) : null}
              </div>
              <ul className="floor-plan-scenes">
                {scenes.map((scene) => (
                  <li
                    key={`floor-plan-${scene.id}`}
                    className="floor-plan-scene"
                    style={{
                      left: toPercentPosition(getMarkerPosition(scene.id).x),
                      top: toPercentPosition(getMarkerPosition(scene.id).y),
                    }}
                  >
                    <button
                      type="button"
                      className="scene"
                      data-id={scene.id}
                      title={scene.name}
                      aria-label={scene.name}
                      {...getMarkerInteractionProps(scene.id)}
                    >
                      <FaLocationDot
                        className="icon"
                        aria-hidden="true"
                        size={floorplanIconSize}
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div id="titleBar">
        <h1 className="sceneName" />
      </div>

      <button
        type="button"
        id="autorotateToggle"
        aria-label="Toggle autorotate"
      >
        <IoPlay className="icon off" aria-hidden="true" />
        <IoPause className="icon on" aria-hidden="true" />
      </button>

      <button
        type="button"
        id="fullscreenToggle"
        aria-label="Toggle fullscreen"
      >
        <IoExpandOutline className="icon off" aria-hidden="true" />
        <IoContractOutline className="icon on" aria-hidden="true" />
      </button>

      <button type="button" id="sceneListToggle" aria-label="Toggle scene list">
        <IoChevronForwardOutline className="icon off" aria-hidden="true" />
        <IoChevronBackOutline className="icon on" aria-hidden="true" />
      </button>
    </>
  );
};

export default MarzipanoTopBar;
