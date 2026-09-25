import { useState } from "react";
import { Link } from "react-router-dom";

function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className="navbar">
            <div className="logo">
                Myoney Loans
            </div>

            <button
                className="menu-toggle"
                onClick={() => setMenuOpen(!menuOpen)}
            >
                ☰
            </button>

            <div className={`nav-content ${menuOpen ? "active" : ""}`}>
                <div className="nav-links">
                    <Link to="/" onClick={() => setMenuOpen(false)}>
                        Home
                    </Link>

                    <Link to="/loans" onClick={() => setMenuOpen(false)}>
                        Loans
                    </Link>

                    <Link to="/about" onClick={() => setMenuOpen(false)}>
                        About
                    </Link>

                    <Link to="/help" onClick={() => setMenuOpen(false)}>
                        Help
                    </Link>

                    <Link to="/contact" onClick={() => setMenuOpen(false)}>
                        Contact
                    </Link>
                </div>

                <div className="nav-buttons">
                    <Link
                        to="/login"
                        className="login-btn"
                        onClick={() => setMenuOpen(false)}
                    >
                        Login
                    </Link>

                    <Link
                        to="/register"
                        className="register-btn"
                        onClick={() => setMenuOpen(false)}
                    >
                        Register
                    </Link>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;