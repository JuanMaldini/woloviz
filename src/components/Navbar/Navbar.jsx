import { Link } from "react-router-dom";
import { useState } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
// import logo from "/public/logo.svg";
import "./Navbar.css";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="navbar-header">
      <div className="nav-brand">
        {/* <img src={logo} alt="Logo" className="logo" height={50}/> */}
        Woloviz
      </div>
      <nav className={`navbar${isMenuOpen ? " nav-open" : ""}`}>
        <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
          Home
        </Link>
        <Link
          to="/contact"
          className="nav-link"
          onClick={() => setIsMenuOpen(false)}
        >
          Contact
        </Link>
        <Link
          to="/sample-ai"
          className="nav-link"
          onClick={() => setIsMenuOpen(false)}
        >
          Sample AI
        </Link>
        <Link
          to="/example"
          className="nav-link"
          onClick={() => setIsMenuOpen(false)}
        >
          Example
        </Link>
      </nav>
      <button
        className="hamburger"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle menu"
      >
        <GiHamburgerMenu />
      </button>
    </header>
  );
};

export default Navbar;
