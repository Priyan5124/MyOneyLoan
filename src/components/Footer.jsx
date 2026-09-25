function Footer() {
    return (
        <footer className="footer">
            <div className="footer-container">

                <div className="footer-about">
                    <h2>Myoney Loans</h2>

                    <p>
                        Fast, secure and reliable loan solutions
                        designed to make borrowing simple.
                    </p>

                    <div className="footer-social">
                        <span>f</span>
                        <span>in</span>
                        <span>𝕏</span>
                        <span>▶</span>
                    </div>
                </div>

                <div className="footer-column">
                    <h3>Quick Links</h3>

                    <a href="/">Home</a>
                    <a href="/loans">Loans</a>
                    <a href="/about">About</a>
                    <a href="/help">Help</a>
                    <a href="/contact">Contact</a>
                </div>

                <div className="footer-column">
                    <h3>Loan Products</h3>

                    <a href="/loans">Personal Loan</a>
                    <a href="/loans">Business Loan</a>
                    <a href="/loans">Education Loan</a>
                    <a href="/loans">Gold Loan</a>
                    <a href="/loans">Emergency Loan</a>
                </div>

                <div className="footer-column">
                    <h3>Support</h3>

                    <a href="/help">Help Center</a>
                    <a href="/contact">Contact Us</a>
                    <a href="/login">Login</a>
                    <a href="/register">Register</a>
                </div>

            </div>

            <div className="footer-bottom">
                <p>
                    © 2026 Myoney Loans. All rights reserved.
                </p>

                <div>
                    <a href="/privacy">Privacy Policy</a>
                    <a href="/terms">Terms & Conditions</a>
                </div>
            </div>
        </footer>
    );
}

export default Footer;