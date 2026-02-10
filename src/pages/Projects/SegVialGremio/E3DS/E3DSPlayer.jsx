import { useRef, useEffect } from "react";
import Sidepanel from "../panel/Sidepanel";

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
    <div className="flex h-screen w-full overflow-hidden bg-black max-md:flex-col">
      <main className="relative flex-1 overflow-hidden">
        <div className="relative h-full w-full">
          <iframe
            ref={iframeRef}
            id="iframe_1"
            src={import.meta.env.VITE_E3DS_URL}
            width="100%"
            height="100%"
            allowFullScreen
            className="h-full w-full border-none"
          />
        </div>
      </main>
      <aside className="w-[260px] overflow-hidden transition-all duration-300 ease-in-out max-md:h-auto max-md:max-h-[40vh] max-md:w-full">
        <Sidepanel />
      </aside>
    </div>
  );
}

export default E3DSPlayer;
