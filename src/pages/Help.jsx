function Help() {
    return (
        <main className="help-page">

            <section className="help-hero">
                <div className="help-hero-content">
                    <span>HELP CENTER</span>

                    <h1>
                        How Can We
                        <strong> Help You?</strong>
                    </h1>

                    <p>
                        Find answers to common questions or get support
                        for your loan application.
                    </p>
                </div>
            </section>

            <section className="help-section">

                <div className="section-heading">
                    <span>HOW CAN WE HELP?</span>

                    <h2>
                        Find the <strong>Support</strong> You Need
                    </h2>

                    <p>
                        Choose an option below to get the information
                        you are looking for.
                    </p>
                </div>

                <div className="help-cards">

                    <div className="help-card">
                        <div className="help-icon">❓</div>

                        <h3>Frequently Asked Questions</h3>

                        <p>
                            Find quick answers to common questions
                            about loans and applications.
                        </p>

                        <a href="/#faq">
                            View FAQs →
                        </a>
                    </div>

                    <div className="help-card">
                        <div className="help-icon">📝</div>

                        <h3>Loan Application Help</h3>

                        <p>
                            Need help understanding the loan application
                            process? We can guide you through it.
                        </p>

                        <a href="/loans">
                            View Loans →
                        </a>
                    </div>

                    <div className="help-card">
                        <div className="help-icon">💬</div>

                        <h3>Customer Support</h3>

                        <p>
                            Have a specific question? Get in touch with
                            our support team.
                        </p>

                        <a href="/contact">
                            Contact Us →
                        </a>
                    </div>

                </div>
            </section>

            <section className="help-info-section">

                <div className="help-info-box">

                    <div>
                        <span>STILL NEED HELP?</span>

                        <h2>
                            We're Here to Help
                        </h2>

                        <p>
                            If you couldn't find the answer you were
                            looking for, contact our support team.
                        </p>
                    </div>

                    <a href="/contact" className="help-contact-btn">
                        Contact Support
                    </a>

                </div>

            </section>

        </main>
    );
}

export default Help;