import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [loanProcessing, setLoanProcessing] = useState(false);
  const [loanRejected, setLoanRejected] = useState(false);
  const [reapplyBlockedUntil, setReapplyBlockedUntil] = useState(null);

  // Loan offer / repayment state
  const [loanOffer, setLoanOffer] = useState(null);
  const [loanActive, setLoanActive] = useState(false);
  const [selectedLoanAmount, setSelectedLoanAmount] = useState("");
  const [selectedTenure, setSelectedTenure] = useState("");
  const [acceptingOffer, setAcceptingOffer] = useState(false);
  const [paymentMonth, setPaymentMonth] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    alert("Logged out successfully!");
    navigate("/login");
  };

  const checkLoanStatus = async () => {
    const userData = localStorage.getItem("user");
    const authToken = localStorage.getItem("token");

    if (!userData || !authToken) {
      setLoanProcessing(false);
      setLoanRejected(false);
      setReapplyBlockedUntil(null);
      setLoanOffer(null);
      setLoanActive(false);
      return;
    }

    try {
      const response = await fetch(
        "https://myoneyloan.onrender.com/api/loans/my-status",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const result = await response.json();
      console.log("Loan status:", result);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load loan status");
      }

      if (result.applicationStatus === "Rejected") {
        setLoanRejected(true);
        setLoanProcessing(false);
        setReapplyBlockedUntil(result.reapplyBlockedUntil || null);
        setLoanOffer(null);
        setLoanActive(false);
        return;
      }

      if (result.applicationStatus === "Pending") {
        setLoanRejected(false);
        setLoanProcessing(true);
        setReapplyBlockedUntil(null);
        setLoanOffer(null);
        setLoanActive(false);
        return;
      }

      if (result.applicationStatus === "Approved") {
        setLoanRejected(false);
        setLoanProcessing(false);
        setReapplyBlockedUntil(null);

        if (
          result.offerStatus === "PendingAcceptance" &&
          result.loanStatus !== "Active"
        ) {
          setLoanOffer(result);
          setLoanActive(false);

          setSelectedLoanAmount(
            result.approvedAmount ? String(result.approvedAmount) : ""
          );

          if (!selectedTenure) {
            setSelectedTenure("12");
          }

          return;
        }

        if (
          result.offerStatus === "Accepted" &&
          (result.loanStatus === "Active" ||
            result.loanStatus === "OfferPending" ||
            result.loanStatus === "Disbursed")
        ) {
          setLoanOffer(null);
          setLoanActive(true);
          return;
        }

        if (result.loanStatus === "Completed") {
          // Keep repayment page until the loan is completed.
          setLoanOffer(null);
          setLoanActive(true);
          return;
        }

        setLoanOffer(null);
        setLoanActive(false);
        return;
      }

      setLoanRejected(false);
      setLoanProcessing(false);
      setReapplyBlockedUntil(null);
      setLoanOffer(null);
      setLoanActive(false);
    } catch (error) {
      console.error("Loan status check error:", error);
      setLoanRejected(false);
      setLoanProcessing(false);
      setReapplyBlockedUntil(null);
      setLoanOffer(null);
      setLoanActive(false);
    }
  };

  useEffect(() => {
    checkLoanStatus();
  }, [token]);

  const handleProtectedAction = () => {
    const authToken = localStorage.getItem("token");

    if (!authToken) {
      navigate("/login");
      return;
    }

    if (loanRejected) {
      let message =
        "Your application was rejected. Please try again after 30 days.";

      if (reapplyBlockedUntil) {
        message += `\n\nYou can apply again after ${new Date(
          reapplyBlockedUntil
        ).toLocaleDateString("en-IN")}.`;
      }

      alert(message);
      return;
    }

    if (loanProcessing) {
      alert(
        "Your loan application is currently under processing. Please wait for the application review to complete."
      );
      return;
    }

    // Once approved/accepted, the user must stay on Home and use the
    // offer/repayment flow. Do not send them back to application.
    if (loanOffer || loanActive) {
      return;
    }

    navigate("/apply");
  };

  const tenureOptions = [3, 6, 9, 12];

  const getInterestRate = (tenure) => {
    if (!loanOffer?.interestRates) return 0;

    const map = {
      3: loanOffer.interestRates.threeMonths,
      6: loanOffer.interestRates.sixMonths,
      9: loanOffer.interestRates.nineMonths,
      12: loanOffer.interestRates.twelveMonths,
    };

    return Number(map[tenure] || 0);
  };

  const offerCalculation = useMemo(() => {
    const amount = Number(selectedLoanAmount);
    const tenure = Number(selectedTenure);
    const interestRate = getInterestRate(tenure);

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !Number.isFinite(tenure) ||
      !tenure ||
      !Number.isFinite(interestRate)
    ) {
      return null;
    }

    const totalInterest =
      amount * (interestRate / 100) * (tenure / 12);

    const totalRepayment = amount + totalInterest;
    const emi = totalRepayment / tenure;

    const processingFee =
      amount *
      (Number(loanOffer.processingFeePercent || 0) / 100);

    const netDisbursement = amount - processingFee;

    return {
      amount,
      tenure,
      interestRate,
      totalInterest,
      totalRepayment,
      emi,
      processingFee,
      netDisbursement,
    };
  }, [
    selectedLoanAmount,
    selectedTenure,
    loanOffer,
  ]);

  const repaymentSchedule = useMemo(() => {
    if (!loanOffer) return [];

    const tenure = Number(loanOffer.selectedTenure);
    const emi = Number(loanOffer.emiAmount);

    if (!tenure || !emi) return [];

    const start = loanOffer.loanStartDate
      ? new Date(loanOffer.loanStartDate)
      : new Date();

    return Array.from({ length: tenure }, (_, index) => {
      const dueDate = new Date(start);
      dueDate.setMonth(dueDate.getMonth() + index + 1);

      const isPaid =
        Number(loanOffer.amountPaid || 0) >=
        emi * (index + 1) - 0.01;

      return {
        month: index + 1,
        dueDate,
        amount: emi,
        isPaid,
      };
    });
  }, [loanOffer]);

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleAcceptOffer = async () => {
    if (!loanOffer) return;

    if (!selectedLoanAmount || !selectedTenure) {
      alert("Please select loan amount and repayment tenure.");
      return;
    }

    const amount = Number(selectedLoanAmount);
    const tenure = Number(selectedTenure);

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Please select a valid loan amount.");
      return;
    }

    if (amount > Number(loanOffer.approvedAmount)) {
      alert("Selected amount cannot exceed the approved amount.");
      return;
    }

    if (!tenureOptions.includes(tenure)) {
      alert("Please select a valid repayment tenure.");
      return;
    }

    try {
      setAcceptingOffer(true);

      const response = await fetch(
        "https://myoneyloan.onrender.com/api/loans/my-offer/accept",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            selectedLoanAmount: amount,
            selectedTenure: tenure,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to accept loan offer."
        );
      }

      alert("Loan offer accepted successfully.");

      // Use the application returned by the backend so repayment
      // details appear immediately on the same Home page.
      const application = result.application;

      setLoanOffer({
        applicationStatus: application.applicationStatus,
        offerStatus: application.offerStatus,
        approvedAmount: application.approvedAmount,
        interestRates: application.interestRates,
        processingFeePercent: application.processingFeePercent,
        foreclosureInterestPercent:
          application.foreclosureInterestPercent,
        selectedLoanAmount:
          application.selectedLoanAmount,
        selectedTenure:
          application.selectedTenure,
        selectedInterestRate:
          application.selectedInterestRate,
        processingFeeAmount:
          application.processingFeeAmount,
        netDisbursementAmount:
          application.netDisbursementAmount,
        emiAmount: application.emiAmount,
        totalInterestAmount:
          application.totalInterestAmount,
        totalRepaymentAmount:
          application.totalRepaymentAmount,
        loanStatus: application.loanStatus,
        disbursementStatus:
          application.disbursementStatus,
        amountPaid: application.amountPaid,
        outstandingAmount:
          application.outstandingAmount,
        nextPaymentDate:
          application.nextPaymentDate,
        loanStartDate:
          application.loanStartDate,
        loanEndDate:
          application.loanEndDate,
        acceptedAt: application.acceptedAt,
        userOfferAcceptedAt:
          application.userOfferAcceptedAt,
      });

      setSelectedLoanAmount("");
      setSelectedTenure("");
      setLoanActive(true);
    } catch (error) {
      console.error("Accept offer error:", error);
      alert(error.message);
    } finally {
      setAcceptingOffer(false);
    }
  };

  /*
   * IMPORTANT:
   * After the user accepts the offer, show ONLY the repayment page.
   * The normal Home sections are not rendered until the loan is finished.
   */
  if (loanActive && loanOffer) {
    const paidAmount = Number(loanOffer.amountPaid || 0);
    const totalRepayment = Number(
      loanOffer.totalRepaymentAmount || 0
    );
    const outstanding =
      loanOffer.outstandingAmount !== undefined &&
        loanOffer.outstandingAmount !== null
        ? Number(loanOffer.outstandingAmount)
        : Math.max(totalRepayment - paidAmount, 0);

    return (
      <div className="repayment-page">
        <div className="repayment-topbar">
          <div>
            <span className="repayment-eyebrow">
              MYONEY LOANS
            </span>
            <h1>Loan Repayment</h1>
            <p>Your active loan repayment schedule</p>
          </div>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        <div className="repayment-summary-grid">
          <div className="repayment-summary-card">
            <span>Loan Amount</span>
            <strong>
              ₹{formatMoney(loanOffer.selectedLoanAmount)}
            </strong>
          </div>

          <div className="repayment-summary-card">
            <span>Tenure</span>
            <strong>
              {loanOffer.selectedTenure} Months
            </strong>
          </div>

          <div className="repayment-summary-card">
            <span>Monthly EMI</span>
            <strong>
              ₹{formatMoney(loanOffer.emiAmount)}
            </strong>
          </div>

          <div className="repayment-summary-card">
            <span>Outstanding</span>
            <strong>
              ₹{formatMoney(outstanding)}
            </strong>
          </div>
        </div>

        <div className="repayment-details-card">
          <div className="repayment-details-header">
            <div>
              <span>REPAYMENT DETAILS</span>
              <h2>Monthly Repayment Schedule</h2>
            </div>

            <div className="loan-status-badge">
              {loanOffer.loanStatus === "Completed"
                ? "LOAN COMPLETED"
                : "LOAN ACTIVE"}
            </div>
          </div>

          <div className="repayment-table">
            <div className="repayment-row repayment-table-head">
              <span>Month</span>
              <span>Due Date</span>
              <span>EMI</span>
              <span>Status</span>
              <span>Action</span>
            </div>

            {repaymentSchedule.map((item) => (
              <div
                className="repayment-row"
                key={item.month}
              >
                <strong>Month {item.month}</strong>

                <span>
                  {formatDate(item.dueDate)}
                </span>

                <strong>
                  ₹{formatMoney(item.amount)}
                </strong>

                <span
                  className={
                    item.isPaid
                      ? "repayment-paid"
                      : "repayment-pending"
                  }
                >
                  {item.isPaid ? "Paid" : "Pending"}
                </span>

                <button
                  className="repayment-pay-btn"
                  disabled={item.isPaid}
                  onClick={() =>
                    !item.isPaid &&
                    setPaymentMonth(item)
                  }
                >
                  {item.isPaid ? "Paid" : "Pay"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {paymentMonth && (
          <div
            className="payment-modal-overlay"
            onClick={() => setPaymentMonth(null)}
          >
            <div
              className="payment-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <button
                className="payment-close-btn"
                onClick={() => setPaymentMonth(null)}
              >
                ×
              </button>

              <span className="repayment-eyebrow">
                EMI PAYMENT
              </span>

              <h2>
                Month {paymentMonth.month}
              </h2>

              <p>
                Pay ₹{formatMoney(paymentMonth.amount)}
              </p>

              <div className="qr-box">
                {/* Put your own QR image at:
                    public/qr-code.png
                    Then this image will be shown here. */}
                <img
                  src="/qr-code.png"
                  alt="Myoney Loans Payment QR Code"
                  onError={(event) => {
                    event.currentTarget.style.display =
                      "none";
                  }}
                />

                <span className="qr-fallback">
                  Add your QR image as
                  <br />
                  <strong>public/qr-code.png</strong>
                </span>
              </div>

              <p className="qr-note">
                Scan the QR code to make your EMI payment.
              </p>

              <button
                className="payment-done-btn"
                onClick={() => {
                  alert(
                    "Payment confirmation will be updated after verification."
                  );
                  setPaymentMonth(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /*
   * OFFER PAGE:
   * Admin Approved -> offer appears on Home.
   * User selects amount + tenure -> monthly EMI preview -> Accept.
   */
  if (loanOffer) {
    return (
      <div className="loan-offer-page">
        <div className="loan-offer-topbar">
          <div className="profile-info">
            <div className="profile-avatar">
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <span>Welcome</span>
              <strong>{user?.fullName}</strong>
            </div>
          </div>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        <section className="loan-offer-card">
          <div className="offer-icon">₹</div>

          <span className="processing-label">
            LOAN OFFER AVAILABLE
          </span>

          <h1>Your Loan Has Been Approved</h1>

          <p>
            Select the amount and repayment period to
            view your EMI schedule.
          </p>

          <div className="offer-approved-box">
            <span>Maximum Approved Amount</span>
            <strong>
              ₹{formatMoney(loanOffer.approvedAmount)}
            </strong>
          </div>

          <div className="offer-selection-grid">
            <div className="offer-field">
              <label>Loan Amount</label>
              <select
                value={selectedLoanAmount}
                onChange={(event) =>
                  setSelectedLoanAmount(
                    event.target.value
                  )
                }
              >
                <option value="">
                  Select amount
                </option>

                {[
                  Number(loanOffer.approvedAmount),
                ]
                  .filter(
                    (amount) =>
                      Number.isFinite(amount) &&
                      amount > 0
                  )
                  .map((amount) => (
                    <option
                      key={amount}
                      value={amount}
                    >
                      ₹{formatMoney(amount)}
                    </option>
                  ))}
              </select>
            </div>

            <div className="offer-field">
              <label>Repayment Tenure</label>
              <select
                value={selectedTenure}
                onChange={(event) =>
                  setSelectedTenure(
                    event.target.value
                  )
                }
              >
                <option value="">
                  Select months
                </option>

                {tenureOptions.map((months) => (
                  <option
                    key={months}
                    value={months}
                  >
                    {months} Months
                  </option>
                ))}
              </select>
            </div>
          </div>

          {offerCalculation && (
            <div className="offer-calculation">
              <div>
                <span>Interest Rate</span>
                <strong>
                  {offerCalculation.interestRate}%
                </strong>
              </div>

              <div>
                <span>Processing Fee</span>
                <strong>
                  ₹
                  {formatMoney(
                    offerCalculation.processingFee
                  )}
                </strong>
              </div>

              <div>
                <span>Net Disbursement</span>
                <strong>
                  ₹
                  {formatMoney(
                    offerCalculation.netDisbursement
                  )}
                </strong>
              </div>

              <div>
                <span>Total Interest</span>
                <strong>
                  ₹
                  {formatMoney(
                    offerCalculation.totalInterest
                  )}
                </strong>
              </div>

              <div className="emi-highlight">
                <span>Monthly EMI</span>
                <strong>
                  ₹{formatMoney(offerCalculation.emi)}
                </strong>
              </div>

              <div>
                <span>Total Repayment</span>
                <strong>
                  ₹
                  {formatMoney(
                    offerCalculation.totalRepayment
                  )}
                </strong>
              </div>
            </div>
          )}

          {offerCalculation && (
            <div className="offer-monthly-preview">
              <h2>Monthly Repayment</h2>

              <div className="offer-monthly-list">
                {Array.from(
                  {
                    length:
                      offerCalculation.tenure,
                  },
                  (_, index) => (
                    <div
                      className="offer-month-row"
                      key={index + 1}
                    >
                      <span>
                        Month {index + 1}
                      </span>

                      <strong>
                        ₹
                        {formatMoney(
                          offerCalculation.emi
                        )}
                      </strong>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          <button
            className="accept-loan-btn"
            onClick={handleAcceptOffer}
            disabled={
              acceptingOffer ||
              !offerCalculation
            }
          >
            {acceptingOffer
              ? "Accepting..."
              : "Accept Loan Offer"}
          </button>
        </section>
      </div>
    );
  }

  return (
    <>
      {loanRejected ? (
        <section className="loan-processing-section">
          <div className="loan-processing-card rejected-card">
            <div className="processing-circle rejected-circle">
              <div className="rejected-icon">✕</div>
            </div>

            <div className="processing-content">
              <span className="processing-label rejected-label">
                APPLICATION REJECTED
              </span>

              <h2>Your Application Was Rejected</h2>

              <p>
                Your loan application has been rejected
                after review of the submitted information
                and documents.
              </p>

              <strong>
                Please try again after 30 days.
              </strong>

              {reapplyBlockedUntil && (
                <small>
                  You can apply again after{" "}
                  {new Date(
                    reapplyBlockedUntil
                  ).toLocaleDateString("en-IN")}
                  .
                </small>
              )}
            </div>
          </div>
        </section>
      ) : loanProcessing ? (
        <section className="loan-processing-section">
          <div className="loan-processing-card">
            <div className="processing-circle">
              <div className="processing-spinner"></div>
            </div>

            <div className="processing-content">
              <span className="processing-label">
                APPLICATION SUBMITTED
              </span>

              <h2>Loan Processing</h2>

              <p>
                Your loan application has been
                submitted successfully.
              </p>

              <strong>Please wait</strong>

              <small>
                Our team is reviewing your
                application and documents.
              </small>
            </div>
          </div>
        </section>
      ) : null}

      {token && user && (
        <div className="home-user-bar">
          <div className="profile-info">
            <div className="profile-avatar">
              {user.fullName?.charAt(0).toUpperCase()}
            </div>

            <div>
              <span>Welcome</span>
              <strong>{user.fullName}</strong>
            </div>
          </div>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      )}

      {/* ================= HERO ================= */}
      <section className="hero">
        <div className="hero-content">
          <span className="hero-tag">
            Trusted Lending Partner
          </span>

          <h1>
            Loans Made
            <span> Simple.</span>
          </h1>

          <p>
            Get the financial support you need with fast,
            secure and reliable loan solutions.
          </p>

          <div className="hero-buttons">
            <button
              className="primary-btn"
              onClick={handleProtectedAction}
            >
              Apply for Loan
            </button>

            <button
              className="secondary-btn"
              onClick={handleProtectedAction}
            >
              Explore Loans
            </button>
          </div>

          <div className="hero-features">
            <div>
              <strong>Fast</strong>
              <small>Processing</small>
            </div>

            <div>
              <strong>Secure</strong>
              <small>Application</small>
            </div>

            <div>
              <strong>Reliable</strong>
              <small>Support</small>
            </div>
          </div>
        </div>

        <div className="hero-card">
          <div className="card-icon">₹</div>

          <h3>Need a Loan?</h3>

          <p>Choose the right loan for your needs.</p>

          <div className="loan-amount">
            <span>Loan Amount</span>
            <strong>₹5,00,000</strong>
          </div>

          <button
            className="card-btn"
            onClick={handleProtectedAction}
          >
            Check Eligibility
          </button>
        </div>
      </section>

      {/* ================= WHY SECTION ================= */}
      <section className="why-section">
        <div className="section-heading">
          <span>WHY MYONEY LOANS?</span>

          <h2>
            Why Choose <strong>Us?</strong>
          </h2>

          <p>
            We make borrowing simple, transparent and reliable.
          </p>
        </div>

        <div className="why-cards">
          <div className="why-card">
            <div className="why-icon">⚡</div>
            <h3>Fast Processing</h3>
            <p>
              Quick application processing so you can
              get financial support when you need it.
            </p>
          </div>

          <div className="why-card">
            <div className="why-icon">🔒</div>
            <h3>Secure & Safe</h3>
            <p>
              Your personal information and application
              details are handled securely.
            </p>
          </div>

          <div className="why-card">
            <div className="why-icon">✓</div>
            <h3>Simple Process</h3>
            <p>
              Apply for a loan through an easy and
              straightforward process.
            </p>
          </div>

          <div className="why-card">
            <div className="why-icon">24</div>
            <h3>Reliable Support</h3>
            <p>
              Get assistance whenever you need help
              with your loan application.
            </p>
          </div>
        </div>
      </section>

      {/* ================= LOANS SECTION ================= */}
      <section className="loans-section">
        <div className="section-heading">
          <span>OUR LOANS</span>

          <h2>
            Find the Right <strong>Loan</strong>
          </h2>

          <p>
            Choose a loan that fits your financial needs.
          </p>
        </div>

        <div className="loan-cards">
          {[
            ["👤", "Personal Loan", "Flexible financing for your personal needs and expenses."],
            ["💼", "Business Loan", "Financial support to start, grow or expand your business."],
            ["🎓", "Education Loan", "Fund your education and build a brighter future."],
            ["💎", "Gold Loan", "Get financial assistance by using your gold as security."],
            ["⚡", "Emergency Loan", "Quick financial assistance for unexpected situations."],
          ].map(([icon, title, text]) => (
            <div className="loan-card" key={title}>
              <div className="loan-card-icon">{icon}</div>
              <h3>{title}</h3>
              <p>{text}</p>
              <button onClick={handleProtectedAction}>
                Learn More →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ================= PROCESS SECTION ================= */}
      <section className="process-section">
        <div className="section-heading">
          <span>HOW IT WORKS</span>

          <h2>
            Get Your Loan in{" "}
            <strong>4 Simple Steps</strong>
          </h2>

          <p>
            Our simple process makes applying for a loan quick and easy.
          </p>
        </div>

        <div className="process-container">
          <div className="process-step">
            <div className="step-number">01</div>
            <div className="step-icon">📝</div>
            <h3>Apply Online</h3>
            <p>
              Fill out our simple online loan application
              with your basic details.
            </p>
          </div>

          <div className="process-line"></div>

          <div className="process-step">
            <div className="step-number">02</div>
            <div className="step-icon">🔍</div>
            <h3>Application Review</h3>
            <p>
              Our team reviews your application and
              required information.
            </p>
          </div>

          <div className="process-line"></div>

          <div className="process-step">
            <div className="step-number">03</div>
            <div className="step-icon">✓</div>
            <h3>Get Approved</h3>
            <p>
              Once your application is approved,
              you will receive the confirmation.
            </p>
          </div>

          <div className="process-line"></div>

          <div className="process-step">
            <div className="step-number">04</div>
            <div className="step-icon">₹</div>
            <h3>Get Your Money</h3>
            <p>
              Receive your approved loan amount
              through the selected process.
            </p>
          </div>
        </div>
      </section>

      {/* ================= REVIEWS SECTION ================= */}
      <section className="reviews-section">
        <div className="section-heading">
          <span>CUSTOMER REVIEWS</span>

          <h2>
            What Our <strong>Customers Say</strong>
          </h2>

          <p>
            Real experiences from people who chose Myoney Loans.
          </p>
        </div>

        <div className="review-cards">
          {[
            ["R", "Rahul Kumar", "Personal Loan", "The application process was simple and the team was very helpful throughout."],
            ["S", "Surya Prakash", "Business Loan", "I needed financial support for my business. The process was quick and easy to understand."],
            ["A", "Anitha Devi", "Education Loan", "The overall experience was smooth and the support team responded quickly."],
          ].map(([initial, name, type, review]) => (
            <div className="review-card" key={name}>
              <div className="stars">★★★★★</div>
              <p>"{review}"</p>

              <div className="customer">
                <div className="customer-avatar">{initial}</div>
                <div>
                  <h4>{name}</h4>
                  <span>{type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FAQ SECTION ================= */}
      <section className="faq-section">
        <div className="section-heading">
          <span>FAQ</span>

          <h2>
            Frequently Asked <strong>Questions</strong>
          </h2>

          <p>
            Find answers to common questions about our loan services.
          </p>
        </div>

        <div className="faq-container">
          <details className="faq-item">
            <summary>How can I apply for a loan?</summary>
            <p>
              Choose the loan product that suits your needs and
              complete the online application form with the required
              information.
            </p>
          </details>

          <details className="faq-item">
            <summary>What types of loans are available?</summary>
            <p>
              Myoney Loans offers Personal, Business, Education,
              Gold and Emergency loan products.
            </p>
          </details>

          <details className="faq-item">
            <summary>How long does the application process take?</summary>
            <p>
              Processing time can vary depending on the loan type
              and application details.
            </p>
          </details>

          <details className="faq-item">
            <summary>Is my information secure?</summary>
            <p>
              Your application information should be handled securely
              and only used for the relevant loan process.
            </p>
          </details>

          <details className="faq-item">
            <summary>How can I contact customer support?</summary>
            <p>
              You can use the Contact or Help section to reach the
              Myoney Loans support team.
            </p>
          </details>
        </div>
      </section>
    </>
  );
}

export default Home;
