function Contact() {
    return (
        <main className="contact-page">

            <section className="contact-hero">
                <div className="contact-hero-content">
                    <span>CONTACT US</span>

                    <h1>
                        We're Here to
                        <strong> Help</strong>
                    </h1>

                    <p>
                        Have a question about our loan products?
                        Get in touch with the Myoney Loans team.
                    </p>
                </div>
            </section>

            <section className="contact-section">

                <div className="contact-container">

                    <div className="contact-info">

                        <span>GET IN TOUCH</span>

                        <h2>
                            Let's Talk About
                            <strong> Your Needs</strong>
                        </h2>

                        <p>
                            Whether you have a question about a loan,
                            your application or our services, we're here
                            to help.
                        </p>

                        <div className="contact-details">

                            <div className="contact-detail">
                                <div className="contact-icon">📞</div>

                                <div>
                                    <h4>Phone</h4>
                                    <p>+91 7448664078 </p>
                                </div>
                            </div>

                            <div className="contact-detail">
                                <div className="contact-icon">✉</div>

                                <div>
                                    <h4>Email</h4>
                                    <p>support@myoneyloans.com</p>
                                </div>
                            </div>

                            <div className="contact-detail">
                                <div className="contact-icon">📍</div>

                                <div>
                                    <h4>Office</h4>
                                    <p>Thanjavur, Tamil Nadu, India</p>
                                </div>
                            </div>

                        </div>

                    </div>

                    <div className="contact-form-box">

                        <h3>Send Us a Message</h3>

                        <p>
                            Fill in your details and we'll get back to you.
                        </p>

                        <form>

                            <div className="form-row">

                                <div className="form-group">
                                    <label>Full Name</label>

                                    <input
                                        type="text"
                                        placeholder="Enter your name"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Phone Number</label>

                                    <input
                                        type="tel"
                                        placeholder="Enter your phone number"
                                    />
                                </div>

                            </div>

                            <div className="form-group">
                                <label>Email Address</label>

                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                />
                            </div>

                            <div className="form-group">
                                <label>Subject</label>

                                <input
                                    type="text"
                                    placeholder="What is your question about?"
                                />
                            </div>

                            <div className="form-group">
                                <label>Message</label>

                                <textarea
                                    rows="5"
                                    placeholder="Write your message..."
                                ></textarea>
                            </div>

                            <button type="submit">
                                Send Message →
                            </button>

                        </form>

                    </div>

                </div>

            </section>

        </main>
    );
}

export default Contact;