import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import logo from "/icons/logo.svg";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasTopBarContent, setHasTopBarContent] = useState(false);
  const navClassName = isMenuOpen
    ? "absolute left-0 right-0 top-full z-50 flex flex-col items-center gap-3 rounded-b-lg bg-white p-4 text-center shadow-md md:static md:flex md:flex-row md:items-center md:gap-3 md:rounded-none md:bg-transparent md:p-0 md:text-left md:shadow-none"
    : "hidden items-center gap-3 md:flex md:items-center md:gap-3";
  const linkClassName =
    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1 text-[14px] font-medium text-slate-900 transition-colors duration-150 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300";

  useEffect(() => {
    const topBar = document.getElementById("marzipanoTopBarSlot");
    if (!topBar) {
      setHasTopBarContent(false);
      return undefined;
    }

    const updateTopBarState = () => {
      setHasTopBarContent(topBar.childNodes.length > 0);
    };

    updateTopBarState();

    const observer = new MutationObserver(updateTopBarState);
    observer.observe(topBar, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return (
    <header className="relative flex w-full items-center gap-3 bg-white px-4 py-2 text-slate-900 sm:px-6">
      <Link
        to="/"
        className="flex items-center gap-2 text-[18px] font-semibold tracking-[0.01em] text-black no-underline hover:opacity-80 sm:text-[20px]"
      >
        <img src={logo} alt="Woloviz logo" className="h-6 w-6 shrink-0" />
        <span
          className={`inline ${
            hasTopBarContent ? "hide-on-topbar-portrait" : ""
          }`}
        >
          Woloviz
        </span>
      </Link>
      <div
        id="marzipanoTopBarSlot"
        className="relative flex-1 h-10 min-h-[40px] overflow-visible"
      />
      <div className="flex items-center gap-3">
        <nav className={navClassName}>
          <Link
            to="/projects"
            className={linkClassName}
            onClick={() => setIsMenuOpen(false)}
          >
            Projects
          </Link>
          <Link
            to="/contact"
            className={linkClassName}
            onClick={() => setIsMenuOpen(false)}
          >
            Contact
          </Link>
        </nav>
        <button
          className="inline-flex items-center justify-center rounded p-1 text-2xl text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300 md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <GiHamburgerMenu />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
