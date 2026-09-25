import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

function AdminDashboard() {
    const navigate = useNavigate();

    const [applications, setApplications] = useState([]);

    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
    });

    const [loading, setLoading] = useState(true);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [processingId, setProcessingId] = useState(null);

    // ==========================================
    // APPROVAL MODAL
    // ==========================================

    const [showApprovalModal, setShowApprovalModal] = useState(false);

    const [approvalForm, setApprovalForm] = useState({
        approvedAmount: "",
        threeMonths: 14,
        sixMonths: 18,
        nineMonths: 20,
        twelveMonths: 24,
        processingFeePercent: 5,
        foreclosureInterestPercent: 15,
    });

    // ==========================================
    // CHECK ADMIN LOGIN
    // ==========================================

    useEffect(() => {
        const adminLoggedIn =
            localStorage.getItem("adminLoggedIn");

        if (adminLoggedIn !== "true") {
            navigate("/login", {
                replace: true,
            });

            return;
        }

        loadDashboard();
    }, [navigate]);

    // ==========================================
    // LOAD DASHBOARD
    // ==========================================

    const loadDashboard = async () => {
        try {
            setLoading(true);

            const [
                applicationsResponse,
                statsResponse,
            ] = await Promise.all([
                fetch(
                    "https://myoneyloan.onrender.com/api/admin/applications"
                ),

                fetch(
                    "https://myoneyloan.onrender.com/api/admin/stats"
                ),
            ]);

            const applicationsData =
                await applicationsResponse.json();

            const statsData =
                await statsResponse.json();

            if (applicationsData.success) {
                setApplications(
                    applicationsData.applications || []
                );
            }

            if (statsData.success) {
                setStats(statsData.stats);
            }
        } catch (error) {
            console.error(
                "Dashboard loading error:",
                error
            );

            alert(
                "Unable to load admin dashboard."
            );
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // OPEN APPROVAL MODAL
    // ==========================================

    const openApprovalModal = (application) => {
        setSelectedApplication(application);

        setApprovalForm({
            approvedAmount:
                application.amount || "",

            threeMonths:
                application.interestRates
                    ?.threeMonths ?? 14,

            sixMonths:
                application.interestRates
                    ?.sixMonths ?? 18,

            nineMonths:
                application.interestRates
                    ?.nineMonths ?? 20,

            twelveMonths:
                application.interestRates
                    ?.twelveMonths ?? 24,

            processingFeePercent:
                application.processingFeeRate ?? 5,

            foreclosureInterestPercent:
                application.foreclosureRate ?? 15,
        });

        setShowApprovalModal(true);
    };

    // ==========================================
    // FORM CHANGE
    // ==========================================

    const handleApprovalChange = (e) => {
        const { name, value } = e.target;

        setApprovalForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // ==========================================
    // APPROVE APPLICATION
    // ==========================================

    const approveApplication = async () => {
        if (!selectedApplication) {
            return;
        }

        const approvedAmount =
            Number(
                approvalForm.approvedAmount
            );

        const requestedAmount =
            Number(
                selectedApplication.amount
            );

        // ======================================
        // AMOUNT VALIDATION
        // ======================================

        if (
            !approvedAmount ||
            approvedAmount <= 0
        ) {
            alert(
                "Please enter a valid approved amount."
            );
            return;
        }

        if (
            approvedAmount >
            requestedAmount
        ) {
            alert(
                `Approved amount cannot exceed ₹${requestedAmount.toLocaleString(
                    "en-IN"
                )}.`
            );
            return;
        }

        // ======================================
        // INTEREST VALIDATION
        // ======================================

        const interestValues = [
            Number(approvalForm.threeMonths),
            Number(approvalForm.sixMonths),
            Number(approvalForm.nineMonths),
            Number(approvalForm.twelveMonths),
        ];

        if (
            interestValues.some(
                (rate) =>
                    !Number.isFinite(rate) ||
                    rate < 0 ||
                    rate > 100
            )
        ) {
            alert(
                "Interest rate must be between 0% and 100%."
            );
            return;
        }

        // ======================================
        // PROCESSING FEE
        // ======================================

        const processingFee =
            Number(
                approvalForm.processingFeePercent
            );

        if (
            !Number.isFinite(processingFee) ||
            processingFee < 0 ||
            processingFee > 100
        ) {
            alert(
                "Processing fee must be between 0% and 100%."
            );
            return;
        }

        // ======================================
        // FORECLOSURE
        // ======================================

        const foreclosureInterest =
            Number(
                approvalForm.foreclosureInterestPercent
            );

        if (
            !Number.isFinite(
                foreclosureInterest
            ) ||
            foreclosureInterest < 0 ||
            foreclosureInterest > 100
        ) {
            alert(
                "Foreclosure interest must be between 0% and 100%."
            );
            return;
        }

        // ======================================
        // CONFIRM
        // ======================================

        const confirmApprove =
            window.confirm(
                `Approve loan for ₹${approvedAmount.toLocaleString(
                    "en-IN"
                )}?\n\nProcessing Fee: ${processingFee}%\n3 Months: ${approvalForm.threeMonths}%\n6 Months: ${approvalForm.sixMonths}%\n9 Months: ${approvalForm.nineMonths}%\n12 Months: ${approvalForm.twelveMonths}%\nForeclosure: ${foreclosureInterest}%`
            );

        if (!confirmApprove) {
            return;
        }

        try {
            setProcessingId(
                selectedApplication._id
            );

            const response = await fetch(
                `https://myoneyloan.onrender.com/api/admin/applications/${selectedApplication._id}/approve`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        approvedAmount,

                        interestRates: {
                            threeMonths:
                                Number(
                                    approvalForm.threeMonths
                                ),

                            sixMonths:
                                Number(
                                    approvalForm.sixMonths
                                ),

                            nineMonths:
                                Number(
                                    approvalForm.nineMonths
                                ),

                            twelveMonths:
                                Number(
                                    approvalForm.twelveMonths
                                ),
                        },

                        processingFeePercent:
                            processingFee,

                        foreclosureInterestPercent:
                            foreclosureInterest,
                    }),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to approve application."
                );
            }

            alert(
                "Loan approved successfully. Offer is now waiting for customer acceptance."
            );

            setShowApprovalModal(false);
            setSelectedApplication(null);

            await loadDashboard();
        } catch (error) {
            console.error(
                "Approve error:",
                error
            );

            alert(
                error.message ||
                "Failed to approve application."
            );
        } finally {
            setProcessingId(null);
        }
    };

    // ==========================================
    // REJECT APPLICATION
    // ==========================================

    const rejectApplication = async (id) => {
        const confirmReject =
            window.confirm(
                "Are you sure you want to reject this loan application?"
            );

        if (!confirmReject) {
            return;
        }

        try {
            setProcessingId(id);

            const response = await fetch(
                `https://myoneyloan.onrender.com/api/admin/applications/${id}/reject`,
                {
                    method: "PUT",
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to reject application."
                );
            }

            alert(
                "Loan application rejected."
            );

            setSelectedApplication(null);

            await loadDashboard();
        } catch (error) {
            console.error(
                "Reject error:",
                error
            );

            alert(
                error.message ||
                "Failed to reject application."
            );
        } finally {
            setProcessingId(null);
        }
    };

    // ==========================================
    // LOGOUT
    // ==========================================

    const handleLogout = () => {
        localStorage.removeItem(
            "adminLoggedIn"
        );

        localStorage.removeItem(
            "adminEmail"
        );

        navigate("/login", {
            replace: true,
        });
    };

    // ==========================================
    // FORMAT CURRENCY
    // ==========================================

    const formatCurrency = (amount) => {
        return Number(amount || 0).toLocaleString(
            "en-IN"
        );
    };

    // ==========================================
    // FORMAT DATE
    // ==========================================

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    // ==========================================
    // CALCULATE NET DISBURSEMENT PREVIEW
    // ==========================================

    const previewApprovedAmount =
        Number(
            approvalForm.approvedAmount
        ) || 0;

    const previewProcessingFee =
        previewApprovedAmount *
        (Number(
            approvalForm.processingFeePercent
        ) || 0) /
        100;

    const previewNetAmount =
        previewApprovedAmount -
        previewProcessingFee;

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <div className="admin-loading">
                <div className="admin-loader"></div>

                <p>
                    Loading dashboard...
                </p>
            </div>
        );
    }

    // ==========================================
    // DASHBOARD
    // ==========================================

    return (
        <div className="admin-dashboard">

            {/* =====================================
                SIDEBAR
            ====================================== */}

            <aside className="admin-sidebar">

                <div>
                    <div className="admin-brand">

                        <div className="admin-brand-icon">
                            M
                        </div>

                        <div>
                            <h2>
                                Myoney
                            </h2>

                            <span>
                                Admin Panel
                            </span>
                        </div>

                    </div>

                    <nav className="admin-nav">

                        <button
                            className="admin-nav-item active"
                        >
                            <span>📊</span>
                            Dashboard
                        </button>

                        <button
                            className="admin-nav-item"
                            onClick={loadDashboard}
                        >
                            <span>🔄</span>
                            Refresh
                        </button>

                    </nav>
                </div>

                <button
                    className="admin-logout"
                    onClick={handleLogout}
                >
                    <span>↪</span>
                    Logout
                </button>

            </aside>

            {/* =====================================
                MAIN
            ====================================== */}

            <main className="admin-main">

                {/* HEADER */}

                <header className="admin-header">

                    <div>

                        <p className="admin-overline">
                            ADMINISTRATION
                        </p>

                        <h1>
                            Loan Dashboard
                        </h1>

                        <p>
                            Manage and review customer loan applications.
                        </p>

                    </div>

                    <div className="admin-profile">

                        <div className="admin-avatar">
                            A
                        </div>

                        <div>
                            <strong>
                                Administrator
                            </strong>

                            <span>
                                {localStorage.getItem(
                                    "adminEmail"
                                )}
                            </span>
                        </div>

                    </div>

                </header>

                {/* =====================================
                    STATS
                ====================================== */}

                <section className="admin-stats">

                    <div className="admin-stat-card">

                        <div className="stat-icon total">
                            📋
                        </div>

                        <div>
                            <span>
                                Total Applications
                            </span>

                            <strong>
                                {stats.total}
                            </strong>
                        </div>

                    </div>

                    <div className="admin-stat-card">

                        <div className="stat-icon pending">
                            ⏳
                        </div>

                        <div>
                            <span>
                                Pending
                            </span>

                            <strong>
                                {stats.pending}
                            </strong>
                        </div>

                    </div>

                    <div className="admin-stat-card">

                        <div className="stat-icon approved">
                            ✓
                        </div>

                        <div>
                            <span>
                                Approved
                            </span>

                            <strong>
                                {stats.approved}
                            </strong>
                        </div>

                    </div>

                    <div className="admin-stat-card">

                        <div className="stat-icon rejected">
                            ×
                        </div>

                        <div>
                            <span>
                                Rejected
                            </span>

                            <strong>
                                {stats.rejected}
                            </strong>
                        </div>

                    </div>

                </section>

                {/* =====================================
                    APPLICATIONS
                ====================================== */}

                <section className="admin-applications">

                    <div className="section-heading">

                        <div>
                            <h2>
                                Loan Applications
                            </h2>

                            <p>
                                Review recently submitted applications.
                            </p>
                        </div>

                        <button
                            className="refresh-button"
                            onClick={loadDashboard}
                        >
                            ↻ Refresh
                        </button>

                    </div>

                    {applications.length === 0 ? (

                        <div className="empty-state">

                            <div>
                                📂
                            </div>

                            <h3>
                                No applications yet
                            </h3>

                            <p>
                                New loan applications will appear here.
                            </p>

                        </div>

                    ) : (

                        <div className="application-table-wrapper">

                            <table className="application-table">

                                <thead>
                                    <tr>

                                        <th>
                                            Applicant
                                        </th>

                                        <th>
                                            Loan Type
                                        </th>

                                        <th>
                                            Requested
                                        </th>

                                        <th>
                                            Income
                                        </th>

                                        <th>
                                            Date
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Action
                                        </th>

                                    </tr>
                                </thead>

                                <tbody>

                                    {applications.map(
                                        (application) => (

                                            <tr
                                                key={
                                                    application._id
                                                }
                                            >

                                                <td>

                                                    <div className="applicant-cell">

                                                        <div className="applicant-avatar">

                                                            {application.fullName
                                                                ?.charAt(
                                                                    0
                                                                )
                                                                ?.toUpperCase() ||
                                                                "U"}

                                                        </div>

                                                        <div>

                                                            <strong>
                                                                {
                                                                    application.fullName
                                                                }
                                                            </strong>

                                                            <span>
                                                                {
                                                                    application.email
                                                                }
                                                            </span>

                                                        </div>

                                                    </div>

                                                </td>

                                                <td>
                                                    {
                                                        application.loanType
                                                    }
                                                </td>

                                                <td>
                                                    ₹
                                                    {formatCurrency(
                                                        application.amount
                                                    )}
                                                </td>

                                                <td>
                                                    ₹
                                                    {formatCurrency(
                                                        application.income
                                                    )}
                                                </td>

                                                <td>
                                                    {formatDate(
                                                        application.createdAt
                                                    )}
                                                </td>

                                                <td>

                                                    <span
                                                        className={`status-badge ${application.applicationStatus?.toLowerCase()}`}
                                                    >
                                                        {
                                                            application.applicationStatus
                                                        }
                                                    </span>

                                                </td>

                                                <td>

                                                    <button
                                                        className="view-button"
                                                        onClick={() =>
                                                            setSelectedApplication(
                                                                application
                                                            )
                                                        }
                                                    >
                                                        View
                                                    </button>

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>

            </main>

            {/* =====================================
                APPLICATION DETAILS MODAL
            ====================================== */}

            {selectedApplication &&
                !showApprovalModal && (

                    <div
                        className="admin-modal-overlay"
                        onClick={() =>
                            setSelectedApplication(
                                null
                            )
                        }
                    >

                        <div
                            className="admin-modal"
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >

                            <div className="modal-header">

                                <div>

                                    <span>
                                        LOAN APPLICATION
                                    </span>

                                    <h2>
                                        Application Details
                                    </h2>

                                </div>

                                <button
                                    className="modal-close"
                                    onClick={() =>
                                        setSelectedApplication(
                                            null
                                        )
                                    }
                                >
                                    ×
                                </button>

                            </div>

                            <div className="modal-status-row">

                                <span>
                                    Application ID
                                </span>

                                <code>
                                    {
                                        selectedApplication._id
                                    }
                                </code>

                            </div>

                            <div className="details-grid">

                                <div>
                                    <label>
                                        Full Name
                                    </label>

                                    <strong>
                                        {
                                            selectedApplication.fullName
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <label>
                                        Phone
                                    </label>

                                    <strong>
                                        {
                                            selectedApplication.phone
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <label>
                                        Email
                                    </label>

                                    <strong>
                                        {
                                            selectedApplication.email
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <label>
                                        Loan Type
                                    </label>

                                    <strong>
                                        {
                                            selectedApplication.loanType
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <label>
                                        Requested Amount
                                    </label>

                                    <strong>
                                        ₹
                                        {formatCurrency(
                                            selectedApplication.amount
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <label>
                                        Monthly Income
                                    </label>

                                    <strong>
                                        ₹
                                        {formatCurrency(
                                            selectedApplication.income
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <label>
                                        Employment
                                    </label>

                                    <strong>
                                        {
                                            selectedApplication.employment
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <label>
                                        Family Phone
                                    </label>

                                    <strong>
                                        {
                                            selectedApplication.familyPhone
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <label>
                                        Account Number
                                    </label>

                                    <strong>
                                        {
                                            selectedApplication.accountNumber
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <label>
                                        IFSC Code
                                    </label>

                                    <strong>
                                        {
                                            selectedApplication.ifscCode
                                        }
                                    </strong>
                                </div>

                            </div>

                            {/* DOCUMENTS */}

                            <div className="documents-section">

                                <h3>
                                    Uploaded Documents
                                </h3>

                                <div className="documents-grid">

                                    {[
                                        [
                                            "Aadhaar Front",
                                            selectedApplication.aadhaarFront,
                                        ],

                                        [
                                            "Aadhaar Back",
                                            selectedApplication.aadhaarBack,
                                        ],

                                        [
                                            "PAN Card",
                                            selectedApplication.panCard,
                                        ],

                                        [
                                            "Bank Passbook",
                                            selectedApplication.bankPassbook,
                                        ],

                                        [
                                            "Selfie",
                                            selectedApplication.selfie,
                                        ],
                                    ].map(
                                        ([name, file]) => (

                                            <a
                                                key={name}
                                                href={
                                                    file
                                                        ? `https://myoneyloan.onrender.com${file}`
                                                        : "#"
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                                className="document-button"
                                            >
                                                📄 {name}
                                            </a>

                                        )
                                    )}

                                </div>

                            </div>

                            {/* ACTIONS */}

                            <div className="modal-actions">

                                {selectedApplication.applicationStatus ===
                                    "Pending" && (

                                        <>
                                            <button
                                                className="reject-button"
                                                disabled={
                                                    processingId ===
                                                    selectedApplication._id
                                                }
                                                onClick={() =>
                                                    rejectApplication(
                                                        selectedApplication._id
                                                    )
                                                }
                                            >
                                                Reject
                                            </button>

                                            <button
                                                className="approve-button"
                                                disabled={
                                                    processingId ===
                                                    selectedApplication._id
                                                }
                                                onClick={() =>
                                                    openApprovalModal(
                                                        selectedApplication
                                                    )
                                                }
                                            >
                                                ✓ Approve & Configure Loan
                                            </button>
                                        </>
                                    )}

                                {selectedApplication.applicationStatus !==
                                    "Pending" && (

                                        <div
                                            className={`final-status ${selectedApplication.applicationStatus?.toLowerCase()}`}
                                        >
                                            Application is{" "}
                                            <strong>
                                                {
                                                    selectedApplication.applicationStatus
                                                }
                                            </strong>
                                        </div>

                                    )}

                            </div>

                        </div>

                    </div>
                )}

            {/* =====================================
                APPROVAL CONFIGURATION MODAL
            ====================================== */}

            {showApprovalModal &&
                selectedApplication && (

                    <div
                        className="admin-modal-overlay approval-overlay"
                        onClick={() =>
                            setShowApprovalModal(false)
                        }
                    >

                        <div
                            className="admin-modal approval-modal"
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >

                            {/* HEADER */}

                            <div className="modal-header">

                                <div>

                                    <span>
                                        LOAN APPROVAL
                                    </span>

                                    <h2>
                                        Configure Loan Offer
                                    </h2>

                                    <p className="approval-subtitle">
                                        Set the final loan terms before sending the offer to the customer.
                                    </p>

                                </div>

                                <button
                                    className="modal-close"
                                    onClick={() =>
                                        setShowApprovalModal(
                                            false
                                        )
                                    }
                                >
                                    ×
                                </button>

                            </div>

                            {/* CUSTOMER INFO */}

                            <div className="approval-customer-card">

                                <div className="approval-customer-avatar">
                                    {selectedApplication.fullName
                                        ?.charAt(0)
                                        ?.toUpperCase() ||
                                        "U"}
                                </div>

                                <div>

                                    <strong>
                                        {
                                            selectedApplication.fullName
                                        }
                                    </strong>

                                    <span>
                                        Requested ₹
                                        {formatCurrency(
                                            selectedApplication.amount
                                        )}
                                    </span>

                                </div>

                            </div>

                            {/* APPROVED AMOUNT */}

                            <div className="approval-section">

                                <div className="approval-section-title">

                                    <span className="approval-step">
                                        01
                                    </span>

                                    <div>
                                        <h3>
                                            Approved Loan Amount
                                        </h3>

                                        <p>
                                            Customer can use any amount up to this approved limit.
                                        </p>
                                    </div>

                                </div>

                                <div className="input-with-prefix">

                                    <span>
                                        ₹
                                    </span>

                                    <input
                                        type="number"
                                        name="approvedAmount"
                                        value={
                                            approvalForm.approvedAmount
                                        }
                                        onChange={
                                            handleApprovalChange
                                        }
                                        min="1"
                                        max={
                                            selectedApplication.amount
                                        }
                                        placeholder="Enter approved amount"
                                    />

                                </div>

                                <small>
                                    Maximum allowed: ₹
                                    {formatCurrency(
                                        selectedApplication.amount
                                    )}
                                </small>

                            </div>

                            {/* INTEREST RATES */}

                            <div className="approval-section">

                                <div className="approval-section-title">

                                    <span className="approval-step">
                                        02
                                    </span>

                                    <div>
                                        <h3>
                                            EMI Interest Rates
                                        </h3>

                                        <p>
                                            Admin can customize each tenure rate.
                                        </p>
                                    </div>

                                </div>

                                <div className="interest-grid">

                                    <div className="interest-card">

                                        <label>
                                            3 Months
                                        </label>

                                        <div className="percent-input">
                                            <input
                                                type="number"
                                                name="threeMonths"
                                                value={
                                                    approvalForm.threeMonths
                                                }
                                                onChange={
                                                    handleApprovalChange
                                                }
                                                min="0"
                                                max="100"
                                                step="0.01"
                                            />

                                            <span>
                                                %
                                            </span>
                                        </div>

                                    </div>

                                    <div className="interest-card">

                                        <label>
                                            6 Months
                                        </label>

                                        <div className="percent-input">
                                            <input
                                                type="number"
                                                name="sixMonths"
                                                value={
                                                    approvalForm.sixMonths
                                                }
                                                onChange={
                                                    handleApprovalChange
                                                }
                                                min="0"
                                                max="100"
                                                step="0.01"
                                            />

                                            <span>
                                                %
                                            </span>
                                        </div>

                                    </div>

                                    <div className="interest-card">

                                        <label>
                                            9 Months
                                        </label>

                                        <div className="percent-input">
                                            <input
                                                type="number"
                                                name="nineMonths"
                                                value={
                                                    approvalForm.nineMonths
                                                }
                                                onChange={
                                                    handleApprovalChange
                                                }
                                                min="0"
                                                max="100"
                                                step="0.01"
                                            />

                                            <span>
                                                %
                                            </span>
                                        </div>

                                    </div>

                                    <div className="interest-card">

                                        <label>
                                            12 Months
                                        </label>

                                        <div className="percent-input">
                                            <input
                                                type="number"
                                                name="twelveMonths"
                                                value={
                                                    approvalForm.twelveMonths
                                                }
                                                onChange={
                                                    handleApprovalChange
                                                }
                                                min="0"
                                                max="100"
                                                step="0.01"
                                            />

                                            <span>
                                                %
                                            </span>
                                        </div>

                                    </div>

                                </div>

                            </div>

                            {/* FEES */}

                            <div className="approval-section">

                                <div className="approval-section-title">

                                    <span className="approval-step">
                                        03
                                    </span>

                                    <div>
                                        <h3>
                                            Fees & Foreclosure
                                        </h3>

                                        <p>
                                            Configure applicable charges.
                                        </p>
                                    </div>

                                </div>

                                <div className="fee-grid">

                                    <div className="fee-card">

                                        <label>
                                            Processing Fee
                                        </label>

                                        <div className="percent-input">

                                            <input
                                                type="number"
                                                name="processingFeePercent"
                                                value={
                                                    approvalForm.processingFeePercent
                                                }
                                                onChange={
                                                    handleApprovalChange
                                                }
                                                min="0"
                                                max="100"
                                                step="0.01"
                                            />

                                            <span>
                                                %
                                            </span>

                                        </div>

                                    </div>

                                    <div className="fee-card">

                                        <label>
                                            Foreclosure Interest
                                        </label>

                                        <div className="percent-input">

                                            <input
                                                type="number"
                                                name="foreclosureInterestPercent"
                                                value={
                                                    approvalForm.foreclosureInterestPercent
                                                }
                                                onChange={
                                                    handleApprovalChange
                                                }
                                                min="0"
                                                max="100"
                                                step="0.01"
                                            />

                                            <span>
                                                %
                                            </span>

                                        </div>

                                    </div>

                                </div>

                            </div>

                            {/* DISBURSEMENT PREVIEW */}

                            <div className="approval-preview">

                                <div>
                                    <span>
                                        Approved Amount
                                    </span>

                                    <strong>
                                        ₹
                                        {formatCurrency(
                                            previewApprovedAmount
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Processing Fee
                                    </span>

                                    <strong>
                                        - ₹
                                        {formatCurrency(
                                            previewProcessingFee
                                        )}
                                    </strong>
                                </div>

                                <div className="preview-total">

                                    <span>
                                        Customer Receives
                                    </span>

                                    <strong>
                                        ₹
                                        {formatCurrency(
                                            previewNetAmount
                                        )}
                                    </strong>

                                </div>

                            </div>

                            {/* IMPORTANT TERMS */}

                            <div className="admin-terms-box">

                                <div className="terms-icon">
                                    !
                                </div>

                                <div>

                                    <strong>
                                        Before approving
                                    </strong>

                                    <p>
                                        The customer will receive this
                                        offer and must accept the loan
                                        terms before the loan becomes
                                        active. EMI payment is scheduled
                                        for the 6th of every month.
                                        Advance payment and foreclosure
                                        options can be handled after
                                        activation.
                                    </p>

                                </div>

                            </div>

                            {/* ACTIONS */}

                            <div className="modal-actions approval-actions">

                                <button
                                    className="cancel-button"
                                    onClick={() =>
                                        setShowApprovalModal(
                                            false
                                        )
                                    }
                                    disabled={
                                        processingId ===
                                        selectedApplication._id
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    className="approve-button"
                                    onClick={
                                        approveApplication
                                    }
                                    disabled={
                                        processingId ===
                                        selectedApplication._id
                                    }
                                >
                                    {processingId ===
                                        selectedApplication._id
                                        ? "Approving..."
                                        : "✓ Approve & Send Offer"}
                                </button>

                            </div>

                        </div>

                    </div>
                )}

        </div>
    );
}

export default AdminDashboard;