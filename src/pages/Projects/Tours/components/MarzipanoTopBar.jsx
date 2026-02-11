const MarzipanoTopBar = ({ scenes, assetUrls }) => {
  return (
    <>
      <input
        type="checkbox"
        id="floorPlanToggle"
        className="floor-plan-toggle"
      />
      <div id="sceneList">
        <ul className="scenes">
          <li className="floor-plan-item">
            <label
              className="scene floor-plan-trigger"
              htmlFor="floorPlanToggle"
            >
              <span className="text">Floorplan</span>
            </label>
          </li>
          {scenes.map((scene) => (
            <li key={scene.id}>
              <button type="button" className="scene" data-id={scene.id}>
                <span className="text">{scene.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div
        className="info-hotspot-modal floor-plan-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Floorplan"
      >
        <div className="floor-plan-panel">
          <div className="info-hotspot-header">
            <div className="info-hotspot-title-wrapper">
              <span className="info-hotspot-title">Floorplan</span>
            </div>
            <label
              className="info-hotspot-close-wrapper floor-plan-close"
              htmlFor="floorPlanToggle"
              aria-label="Close floor plan"
            >
              <span className="floor-plan-close-icon">X</span>
            </label>
          </div>
          <div className="info-hotspot-text">
            <ul className="floor-plan-scenes">
              {scenes.map((scene) => (
                <li key={`floor-plan-${scene.id}`}>
                  <button type="button" className="scene" data-id={scene.id}>
                    <span className="text">{scene.name}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="floor-plan-image">Placeholder image</div>
          </div>
        </div>
      </div>

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
