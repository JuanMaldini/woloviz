import AppRoutes from "../../routes/AppRoutes";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import "./App.css";

function App() {
  const location = useLocation();
  const hideFooterOn = new Set([
    "/sample-ai",
    "/example",
    "/samplesvg",
    "/playground",
  ]);
  const shouldHideFooter = hideFooterOn.has(location.pathname.toLowerCase());
  const layoutClass = `flex min-h-[100dvh] w-full flex-col bg-[#d9d9d9]${shouldHideFooter ? " h-[100dvh] overflow-hidden" : ""}`;
  const bodyClass = `flex min-h-0 flex-1 flex-col${shouldHideFooter ? " h-full overflow-hidden" : ""}`;

  useEffect(() => {
    if (!shouldHideFooter) {
      return undefined;
    }

    const body = document.body;
    const previousOverflow = body.style.overflow;

    body.style.overflow = "hidden";

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [shouldHideFooter]);

  useEffect(() => {
    const body = document.body;
    const cleanupClasses = [
      "multiple-scenes",
      "single-scene",
      "view-control-buttons",
      "desktop",
      "mobile",
      "no-touch",
      "touch",
      "tooltip-fallback",
      "fullscreen-enabled",
      "fullscreen-unavailable",
      "fullscreen-disabled",
    ];
    cleanupClasses.forEach((className) => body.classList.remove(className));

    const resetLink = document.querySelector('link[data-marzipano="reset"]');
    if (resetLink?.parentNode) {
      resetLink.parentNode.removeChild(resetLink);
    }
  }, [location.pathname]);

  return (
    <main className={layoutClass}>
      <div className="sticky top-0 z-[100] bg-white shadow-sm">
        <Navbar />
      </div>
      <div className={`${bodyClass} w-full`}>
        <div
          className={`flex min-h-0 flex-1 flex-col${shouldHideFooter ? " h-full" : ""}`}
        >
          <AppRoutes />
        </div>
      </div>
      {!shouldHideFooter && (
        <div className="shrink-0">
          <Footer />
        </div>
      )}
    </main>
  );
}

export default App;
