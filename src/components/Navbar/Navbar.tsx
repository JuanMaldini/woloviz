import { Link } from "react-router-dom";
import { useState } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import "./Navbar.css";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="navbar-header">
      <nav className={`navbar${isMenuOpen ? " nav-open" : ""}`}>
        <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
          Home
        </Link>
        <Link to="/contact" className="nav-link" onClick={() => setIsMenuOpen(false)}>
          Contact
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
