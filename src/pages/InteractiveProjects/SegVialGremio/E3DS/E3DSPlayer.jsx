import "./E3DSPlayer.css";
import { useRef, useEffect } from "react";
import Sidepanel from "../panel/sidepanel/Sidepanel";

function E3DSPlayer() {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframeElement = iframeRef.current;
    if (!iframeElement) return;

    const handleMessageFromE3DS = (event) => {
      console.log("[E3DS] Mensaje recibido:", event.data);
    };

    window.addEventListener("message", handleMessageFromE3DS);

    return () => {
      window.removeEventListener("message", handleMessageFromE3DS);
    };
  }, []);

  return (
    <div className="e3ds-shell is-open">
      <main className="e3ds-main">
        <div className="e3ds-video-wrapper">
          <iframe
            ref={iframeRef}
            id="iframe_1"
            src={import.meta.env.VITE_E3DS_URL}
            width="100%"
            height="100%"
            allowFullScreen
            className="e3ds-iframe"
          />
        </div>
      </main>
      <aside className="e3ds-aside">
        <Sidepanel />
      </aside>
    </div>
  );
}

export default E3DSPlayer;
