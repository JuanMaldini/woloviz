import AppRoutes from "../../routes/AppRoutes";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { useLocation } from "react-router-dom";
import "./App.css";

function App() {
  const location = useLocation();
  const hideFooterOn = new Set([
    "/sample_svg",
  ]);
  const shouldHideFooter = hideFooterOn.has(location.pathname.toLowerCase());
  const layoutClass = `app-layout backgroundColor${shouldHideFooter ? " immersive-layout" : ""}`;

  return (
    <main className={layoutClass}>
      <div className="app-header">
        <Navbar />
      </div>
      <div className="app-body">
        <AppRoutes />
      </div>
      {!shouldHideFooter && (
        <div className="app-footer">
          <Footer />
        </div>
      )}
    </main>
  );
}

export default App;
