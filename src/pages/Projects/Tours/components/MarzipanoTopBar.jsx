//adding fllorplan image
const MarzipanoTopBar = ({
  scenes,
  assetUrls,
  showFloorplan = true,
  floorplanPositions = [],
}) => {
  const floorplanIconSize = 30;
  const positionById = floorplanPositions.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

  return (
    <>
      {showFloorplan && (
        <input
          type="checkbox"
          id="floorPlanToggle"
          className="floor-plan-toggle"
        />
      )}
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
              <label
                className="scene floor-plan-trigger"
                htmlFor="floorPlanToggle"
              >
                <span className="text">Floorplan</span>
              </label>
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
          className="info-hotspot-modal floor-plan-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Floorplan"
        >
          <label
            className="floor-plan-backdrop"
            htmlFor="floorPlanToggle"
            aria-label="Close floor plan"
          />
          <div className="floor-plan-panel">
            <div className="floor-plan-stage">
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
                      left:
                        typeof positionById[scene.id]?.x === "number"
                          ? `${positionById[scene.id].x}%`
                          : (positionById[scene.id]?.x ?? "0%"),
                      top:
                        typeof positionById[scene.id]?.y === "number"
                          ? `${positionById[scene.id].y}%`
                          : (positionById[scene.id]?.y ?? "0%"),
                    }}
                  >
                    <button
                      type="button"
                      className="scene"
                      data-id={scene.id}
                      title={scene.name}
                      aria-label={scene.name}
                    >
                      <img
                        src={assetUrls.location}
                        alt=""
                        width={floorplanIconSize}
                        height={floorplanIconSize}
                        loading="lazy"
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
        <img className="icon off" src={assetUrls.play} alt="Play" />
        <img className="icon on" src={assetUrls.pause} alt="Pause" />
      </button>

      <button
        type="button"
        id="fullscreenToggle"
        aria-label="Toggle fullscreen"
      >
        <img className="icon off" src={assetUrls.fullscreen} alt="Fullscreen" />
        <img className="icon on" src={assetUrls.windowed} alt="Windowed" />
      </button>

      <button type="button" id="sceneListToggle" aria-label="Toggle scene list">
        <img className="icon off" src={assetUrls.expand} alt="Expand" />
        <img className="icon on" src={assetUrls.collapse} alt="Collapse" />
      </button>
    </>
  );
};

export default MarzipanoTopBar;
