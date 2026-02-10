const MarzipanoTopBar = ({ scenes, assetUrls }) => {
  return (
    <>
      <div id="sceneList">
        <ul className="scenes">
          {scenes.map((scene) => (
            <li key={scene.id}>
              <button type="button" className="scene" data-id={scene.id}>
                <span className="text">{scene.name}</span>
              </button>
            </li>
          ))}
        </ul>
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
