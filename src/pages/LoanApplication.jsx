import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./LoanApplication.css";

function LoanApplication() {

    const navigate = useNavigate();

    const [searchParams] =
        useSearchParams();

    const amountFromHome =
        searchParams.get("amount") || "";


    // ==========================================
    // FORM DATA
    // ==========================================

    const [formData, setFormData] =
        useState({

            fullName: "",
            email: "",
            phone: "",
            otp: "",

            loanType: "",
            amount: amountFromHome,

            income: "",
            employment: "",
            familyPhone: "",

            aadhaarFront: null,
            aadhaarBack: null,
            panCard: null,

            bankAccountNumber: "",
            ifscCode: "",
            bankPassbook: null,

            selfie: null,

        });


    // ==========================================
    // OTP
    // ==========================================

    const [otpSent, setOtpSent] =
        useState(false);

    const [otpVerified, setOtpVerified] =
        useState(false);

    const [otpError, setOtpError] =
        useState(false);

    const [generatedOtp, setGeneratedOtp] =
        useState("");

    const [reapplyBlocked, setReapplyBlocked] =
        useState(false);

    const [reapplyBlockedUntil, setReapplyBlockedUntil] =
        useState(null);
    // ==========================================
    // ELIGIBILITY
    // ==========================================

    const [eligibility, setEligibility] =
        useState(null);
    // ==========================================
    // TERMS
    // ==========================================

    const [termsAccepted, setTermsAccepted] =
        useState(false);


    // ==========================================
    // SUBMIT LOADING
    // ==========================================

    const [isSubmitting, setIsSubmitting] =
        useState(false);


    // ==========================================
    // LOAD LOGGED USER
    // ==========================================

    useEffect(() => {

        const userData =
            localStorage.getItem("user");


        if (userData) {

            try {

                const user =
                    JSON.parse(userData);


                setFormData((prev) => ({

                    ...prev,

                    fullName:
                        prev.fullName ||
                        user.fullName ||
                        "",

                    email:
                        prev.email ||
                        user.email ||
                        "",

                    phone:
                        prev.phone ||
                        user.phone ||
                        "",

                    amount:
                        amountFromHome ||
                        prev.amount,

                }));

            } catch (error) {

                console.error(
                    "User data parse error:",
                    error
                );

            }

        }

        else if (amountFromHome) {

            setFormData((prev) => ({

                ...prev,

                amount:
                    amountFromHome,

            }));

        }
    }, [amountFromHome]);
    // ==========================================
    // CHECK APPLICATION STATUS
    // ==========================================

    useEffect(() => {

        const checkApplicationStatus = async () => {

            try {

                const token =
                    localStorage.getItem("token");

                if (!token) {
                    return;
                }

                const response =
                    await fetch(
                        "https://myoneyloan.onrender.com/api/loans/my-status",
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },
                        }
                    );

                const result =
                    await response.json();

                if (
                    result.success &&
                    result.applicationStatus === "Rejected" &&
                    result.canApply === false
                ) {

                    setReapplyBlocked(true);

                    setReapplyBlockedUntil(
                        result.reapplyBlockedUntil
                    );

                } else {

                    setReapplyBlocked(false);

                    setReapplyBlockedUntil(null);

                }

            } catch (error) {

                console.error(
                    "Application status check error:",
                    error
                );

            }

        };

        checkApplicationStatus();

    }, []);






    // ==========================================
    // INPUT CHANGE
    // ==========================================

    const handleChange = (e) => {

        const {
            name,
            value,
        } = e.target;


        // MOBILE NUMBERS
        if (
            name === "phone" ||
            name === "familyPhone"
        ) {

            const cleanValue =
                value
                    .replace(/\D/g, "")
                    .slice(0, 10);


            setFormData((prev) => ({

                ...prev,

                [name]:
                    cleanValue,

            }));


            // Reset OTP if main phone changed
            if (name === "phone") {

                setOtpSent(false);

                setOtpVerified(false);

                setOtpError(false);

                setGeneratedOtp("");


                setFormData((prev) => ({

                    ...prev,

                    otp: "",

                }));

            }


            return;
        }


        setFormData((prev) => ({

            ...prev,

            [name]:
                value,

        }));


        // Eligibility becomes invalid
        // when these values change

        if (
            name === "amount" ||
            name === "income" ||
            name === "loanType"
        ) {

            setEligibility(null);

        }

    };


    // ==========================================
    // FILE UPLOAD
    // ==========================================

    const handleFileChange = (e) => {

        const {
            name,
            files,
        } = e.target;


        const file =
            files?.[0] || null;


        if (!file) {
            return;
        }


        // MAX 5 MB

        if (
            file.size >
            5 * 1024 * 1024
        ) {

            alert(
                "File size must be 5 MB or less."
            );

            e.target.value = "";

            return;
        }


        const allowedTypes = [

            "image/jpeg",
            "image/jpg",
            "image/png",
            "application/pdf",

        ];


        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            alert(
                "Only JPG, JPEG, PNG or PDF files are allowed."
            );

            e.target.value = "";

            return;
        }


        setFormData((prev) => ({

            ...prev,

            [name]:
                file,

        }));

    };


    // ==========================================
    // SELFIE
    // ==========================================

    const handleSelfieChange = (e) => {

        const file =
            e.target.files?.[0];


        if (!file) {
            return;
        }


        const allowedTypes = [

            "image/jpeg",
            "image/jpg",
            "image/png",

        ];


        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            alert(
                "Please upload a JPG, JPEG or PNG selfie."
            );

            e.target.value = "";

            return;
        }


        if (
            file.size >
            5 * 1024 * 1024
        ) {

            alert(
                "Selfie image must be 5 MB or less."
            );

            e.target.value = "";

            return;
        }


        setFormData((prev) => ({

            ...prev,

            selfie:
                file,

        }));

    };


    // ==========================================
    // REMOVE SELFIE
    // ==========================================

    const removeSelfie = () => {

        setFormData((prev) => ({

            ...prev,

            selfie: null,

        }));

    };


    // ==========================================
    // SEND OTP
    // ==========================================

    const sendOtp = () => {

        const phone =
            formData.phone.trim();


        if (
            !/^[6-9]\d{9}$/.test(phone)
        ) {

            alert(
                "Please enter a valid 10-digit mobile number."
            );

            return;
        }


        // Generate 6 digit OTP

        const otp =
            Math.floor(
                100000 +
                Math.random() * 900000
            ).toString();


        setGeneratedOtp(otp);

        setOtpSent(true);

        setOtpVerified(false);

        setOtpError(false);


        // ======================================
        // DEVELOPMENT OTP
        // BROWSER ALERT ONLY
        // ======================================

        alert(
            `Your OTP is: ${otp}`
        );

    };


    // ==========================================
    // VERIFY OTP
    // ==========================================

    const verifyOtp = () => {

        if (
            !otpSent ||
            !generatedOtp
        ) {

            alert(
                "Please click Send OTP first."
            );

            return;
        }


        if (
            !/^\d{6}$/.test(
                formData.otp
            )
        ) {

            setOtpVerified(false);

            setOtpError(true);

            alert(
                "Please enter the 6-digit OTP."
            );

            return;
        }


        if (
            formData.otp ===
            generatedOtp
        ) {

            setOtpVerified(true);

            setOtpError(false);


            alert(
                "Mobile number verified successfully."
            );

        }

        else {

            setOtpVerified(false);

            setOtpError(true);


            alert(
                "Incorrect OTP. Please try again."
            );

        }

    };

    // ==========================================
    // CHECK ELIGIBILITY
    // ==========================================

    const checkEligibility = () => {

        const amount =
            Number(formData.amount);

        const income =
            Number(formData.income);


        if (!formData.loanType) {

            setEligibility({

                status: "error",

                message:
                    "Please select a loan type.",

            });

            return;
        }


        if (
            !amount ||
            amount <= 0
        ) {

            setEligibility({

                status: "error",

                message:
                    "Please enter a valid loan amount.",

            });

            return;
        }


        if (
            !income ||
            income <= 0
        ) {

            setEligibility({

                status: "error",

                message:
                    "Please enter your monthly income.",

            });

            return;
        }


        // Maximum loan amount

        if (
            amount > 500000
        ) {

            setEligibility({

                status: "warning",

                message:
                    "This loan amount requires further assessment.",

            });

            return;
        }


        // Income comparison

        if (
            amount >
            income * 10
        ) {

            setEligibility({

                status: "warning",

                message:
                    "Based on the entered income, this amount may require further assessment.",

            });

            return;
        }


        setEligibility({

            status: "success",

            message:
                "You may be eligible for this loan amount.",

        });

    };
    // ==========================================
    // SUBMIT APPLICATION
    // ==========================================

    const handleSubmit = async (e) => {

        e.preventDefault();


        if (isSubmitting) {
            return;
        }


        // ======================================
        // TOKEN
        // ======================================

        const token =
            localStorage.getItem(
                "token"
            );


        if (!token) {

            alert(
                "Please login before submitting the loan application."
            );

            navigate(
                "/login"
            );

            return;
        }


        // ======================================
        // BASIC VALIDATION
        // ======================================

        if (
            !formData.fullName.trim()
        ) {

            alert(
                "Please enter your full name."
            );

            return;
        }


        if (
            !formData.email.trim()
        ) {

            alert(
                "Please enter your email address."
            );

            return;
        }


        if (
            !/^[6-9]\d{9}$/.test(
                formData.phone
            )
        ) {

            alert(
                "Please enter a valid 10-digit mobile number."
            );

            return;
        }


        // ======================================
        // OTP
        // ======================================

        if (!otpVerified) {

            alert(
                "Please verify your mobile number."
            );

            return;
        }


        // ======================================
        // LOAN
        // ======================================

        if (!formData.loanType) {

            alert(
                "Please select a loan type."
            );

            return;
        }


        if (
            !formData.amount ||
            Number(formData.amount) <= 0
        ) {

            alert(
                "Please enter a valid loan amount."
            );

            return;
        }


        if (
            !formData.income ||
            Number(formData.income) <= 0
        ) {

            alert(
                "Please enter your monthly income."
            );

            return;
        }


        if (!formData.employment) {

            alert(
                "Please select your employment type."
            );

            return;
        }


        if (
            !formData.familyPhone ||
            !/^[6-9]\d{9}$/.test(
                formData.familyPhone
            )
        ) {

            alert(
                "Please enter a valid family/alternate mobile number."
            );

            return;
        }


        // ======================================
        // BANK
        // ======================================

        if (
            !formData.bankAccountNumber.trim()
        ) {

            alert(
                "Please enter your bank account number."
            );

            return;
        }


        if (
            !formData.ifscCode.trim()
        ) {

            alert(
                "Please enter your IFSC code."
            );

            return;
        }


        // ======================================
        // DOCUMENTS
        // ======================================

        if (!formData.aadhaarFront) {

            alert(
                "Please upload Aadhaar front image."
            );

            return;
        }


        if (!formData.aadhaarBack) {

            alert(
                "Please upload Aadhaar back image."
            );

            return;
        }


        if (!formData.panCard) {

            alert(
                "Please upload PAN card."
            );

            return;
        }


        if (!formData.bankPassbook) {

            alert(
                "Please upload bank passbook."
            );

            return;
        }


        if (!formData.selfie) {

            alert(
                "Please upload your selfie."
            );

            return;
        }


        // ======================================
        // ELIGIBILITY
        // ======================================

        if (
            !eligibility ||
            eligibility.status !==
            "success"
        ) {

            alert(
                "Please check your eligibility before applying."
            );

            return;
        }


        // ======================================
        // TERMS
        // ======================================

        if (!termsAccepted) {

            alert(
                "Please accept the Terms & Conditions before submitting."
            );

            return;
        }


        try {

            setIsSubmitting(true);


            // ======================================
            // FORM DATA
            // ======================================

            const data =
                new FormData();


            data.append(
                "fullName",
                formData.fullName.trim()
            );


            data.append(
                "email",
                formData.email
                    .trim()
                    .toLowerCase()
            );


            data.append(
                "phone",
                formData.phone
            );


            data.append(
                "loanType",
                formData.loanType
            );


            data.append(
                "amount",
                formData.amount
            );


            data.append(
                "income",
                formData.income
            );


            data.append(
                "employment",
                formData.employment
            );


            data.append(
                "familyPhone",
                formData.familyPhone
            );


            // IMPORTANT:
            // Backend expects accountNumber

            data.append(
                "accountNumber",
                formData.bankAccountNumber.trim()
            );


            data.append(
                "ifscCode",
                formData.ifscCode
                    .trim()
                    .toUpperCase()
            );


            // ======================================
            // DOCUMENTS
            // ======================================

            data.append(
                "aadhaarFront",
                formData.aadhaarFront
            );


            data.append(
                "aadhaarBack",
                formData.aadhaarBack
            );


            data.append(
                "panCard",
                formData.panCard
            );


            data.append(
                "bankPassbook",
                formData.bankPassbook
            );


            data.append(
                "selfie",
                formData.selfie
            );


            data.append(
                "eligibilityStatus",
                "eligible"
            );


            data.append(
                "termsAccepted",
                "true"
            );


            // ======================================
            // BACKEND API
            // ======================================

            const response =
                await fetch(

                    "https://myoneyloan.onrender.com/api/loans/apply",

                    {

                        method: "POST",

                        headers: {

                            // IMPORTANT
                            // authMiddleware requires this

                            Authorization:
                                `Bearer ${token}`,

                        },

                        body: data,

                    }

                );


            // ======================================
            // SAFE RESPONSE
            // ======================================

            const responseText =
                await response.text();


            let result = {};


            try {

                result =
                    responseText
                        ? JSON.parse(
                            responseText
                        )
                        : {};

            }

            catch (jsonError) {

                console.error(
                    "Backend returned non-JSON response:",
                    responseText
                );


                throw new Error(

                    "Backend returned an invalid response. Make sure the backend is running on https://myoneyloan.onrender.com and the /api/loans/apply route is available."

                );

            }


            // ======================================
            // BACKEND ERROR
            // ======================================

            if (!response.ok) {

                throw new Error(

                    result.message ||

                    `Application submission failed. Status: ${response.status}`

                );

            }


            if (!result.success) {

                throw new Error(

                    result.message ||

                    "Application submission failed."

                );

            }


            // ======================================
            // SAVE USER PROCESSING STATUS
            // ONLY AFTER SUCCESS
            // ======================================

            const userData =
                localStorage.getItem(
                    "user"
                );


            if (userData) {

                try {

                    const user =
                        JSON.parse(
                            userData
                        );


                    if (user?.id) {

                        localStorage.setItem(

                            `loanProcessing_${user.id}`,

                            "true"

                        );

                    }

                }

                catch (error) {

                    console.error(
                        "Could not save processing status:",
                        error
                    );

                }

            }


            // ======================================
            // SAVE APPLICATION ID
            // ======================================

            localStorage.setItem(

                "loanApplicationId",

                result.applicationId ||
                ""

            );


            // ======================================
            // SUCCESS
            // ======================================

            alert(

                `Loan application submitted successfully!\n\nApplication ID: ${result.applicationId || "Submitted"}`

            );


            // ======================================
            // HOME
            // ======================================

            navigate(
                "/",
                {
                    replace: true,
                }
            );


        }

        catch (error) {

            console.error(
                "Loan application submit error:",
                error
            );


            alert(

                error.message ||

                "Something went wrong while submitting the application."

            );

        }

        finally {

            setIsSubmitting(false);

        }

    };


    // ==========================================
    // FILE NAME
    // ==========================================

    const fileName = (
        file,
        fallback
    ) => {

        return (
            file?.name ||
            fallback
        );

    };


    // ==========================================
    // UI
    // ==========================================

    return (

        <main className="application-page">


            {/* ======================================
                HERO
            ====================================== */}

            <section className="application-hero">

                <div className="application-hero-inner">

                    <span className="application-eyebrow">
                        MYONEY LOANS • SECURE APPLICATION
                    </span>


                    <h1>
                        Apply for Your{" "}
                        <strong>
                            Loan
                        </strong>
                    </h1>


                    <p>
                        Complete your details,
                        verify your mobile number,
                        check eligibility and
                        submit your documents securely.
                    </p>


                    <div className="application-steps">

                        <span>
                            01 Personal
                        </span>

                        <span>
                            02 Loan
                        </span>

                        <span>
                            03 Income
                        </span>

                        <span>
                            04 Documents
                        </span>

                        <span>
                            05 Bank
                        </span>

                        <span>
                            06 Verification
                        </span>

                    </div>

                </div>

            </section>

            {/* ======================================
                APPLICATION CARD
            ====================================== */}

            <section className="application-section">

                <div className="application-card">


                    <div className="application-heading">

                        <span>
                            GET STARTED
                        </span>


                        <h2>
                            Loan Application Form
                        </h2>


                        <p>
                            Please provide accurate
                            information. All required
                            fields must be completed
                            before submission.
                        </p>

                    </div>

                    {reapplyBlocked ? (

                        <div className="reapply-blocked">

                            <div className="reapply-blocked-icon">
                                ⚠️
                            </div>

                            <h2>
                                Application Rejected
                            </h2>

                            <p>
                                Your application was rejected.
                            </p>

                            <p>
                                Please try again after 30 days.
                            </p>

                            {reapplyBlockedUntil && (

                                <div className="reapply-date">

                                    You can apply again after{" "}

                                    <strong>
                                        {new Date(
                                            reapplyBlockedUntil
                                        ).toLocaleDateString("en-IN")}
                                    </strong>

                                </div>

                            )}

                            <button
                                type="button"
                                className="back-home-btn"
                                onClick={() =>
                                    navigate("/")
                                }
                            >
                                Back to Home
                            </button>

                        </div>

                    ) : (

                        <form
                            onSubmit={handleSubmit}
                        >




                            {/* ======================================
                            PERSONAL DETAILS
                        ====================================== */}

                            <div className="form-section">

                                <div className="form-section-title">

                                    <span>
                                        01
                                    </span>

                                    <div>

                                        <h3>
                                            Personal Details
                                        </h3>

                                        <p>
                                            Your basic contact
                                            information.
                                        </p>

                                    </div>

                                </div>


                                <div className="application-grid">


                                    <div className="form-group">

                                        <label>
                                            Full Name
                                        </label>


                                        <input
                                            type="text"
                                            name="fullName"
                                            placeholder="Enter your full name"
                                            value={
                                                formData.fullName
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                        />

                                    </div>


                                    <div className="form-group">

                                        <label>
                                            Email Address
                                        </label>


                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="Enter your email"
                                            value={
                                                formData.email
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                        />

                                    </div>


                                    {/* MOBILE */}

                                    <div className="form-group full-width">

                                        <label>
                                            Mobile Number
                                        </label>


                                        <div className="phone-otp-row">

                                            <input
                                                type="tel"
                                                name="phone"
                                                placeholder="10-digit mobile number"
                                                value={
                                                    formData.phone
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                maxLength={10}
                                                inputMode="numeric"
                                                required
                                            />


                                            <button
                                                type="button"
                                                className="otp-btn"
                                                onClick={
                                                    sendOtp
                                                }
                                            >

                                                {
                                                    otpSent
                                                        ? "Resend OTP"
                                                        : "Send OTP"
                                                }

                                            </button>

                                        </div>

                                    </div>


                                    {/* OTP */}

                                    {otpSent && (

                                        <div className="form-group full-width otp-area">

                                            <label>
                                                Enter OTP
                                            </label>


                                            <div className="phone-otp-row">

                                                <input
                                                    type="text"
                                                    name="otp"
                                                    placeholder="Enter 6-digit OTP"
                                                    value={
                                                        formData.otp
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    maxLength={6}
                                                    inputMode="numeric"
                                                />


                                                <button
                                                    type="button"
                                                    className="otp-btn"
                                                    onClick={
                                                        verifyOtp
                                                    }
                                                >
                                                    Verify OTP
                                                </button>

                                            </div>


                                            {otpVerified && (

                                                <small className="verified-text">

                                                    ✓ Mobile number verified

                                                </small>

                                            )}


                                            {otpError && (

                                                <small className="otp-error-text">

                                                    ✕ Incorrect OTP.
                                                    Please try again.

                                                </small>

                                            )}

                                        </div>

                                    )}

                                </div>

                            </div>


                            {/* ======================================
                            LOAN DETAILS
                        ====================================== */}

                            <div className="form-section">

                                <div className="form-section-title">

                                    <span>
                                        02
                                    </span>

                                    <div>

                                        <h3>
                                            Loan Details
                                        </h3>

                                        <p>
                                            Select the loan
                                            product and amount.
                                        </p>

                                    </div>

                                </div>


                                <div className="application-grid">


                                    <div className="form-group">

                                        <label>
                                            Loan Type
                                        </label>


                                        <select
                                            name="loanType"
                                            value={
                                                formData.loanType
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                        >

                                            <option value="">
                                                Select Loan Type
                                            </option>

                                            <option value="Personal Loan">
                                                Personal Loan
                                            </option>

                                            <option value="Business Loan">
                                                Business Loan
                                            </option>

                                            <option value="Education Loan">
                                                Education Loan
                                            </option>

                                            <option value="Gold Loan">
                                                Gold Loan
                                            </option>

                                            <option value="Emergency Loan">
                                                Emergency Loan
                                            </option>

                                        </select>

                                    </div>


                                    <div className="form-group">

                                        <label>
                                            Loan Amount
                                        </label>


                                        <div className="input-with-symbol">

                                            <span>
                                                ₹
                                            </span>


                                            <input
                                                type="number"
                                                name="amount"
                                                placeholder="Enter loan amount"
                                                value={
                                                    formData.amount
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                min="1000"
                                                required
                                            />

                                        </div>

                                    </div>

                                </div>

                            </div>


                            {/* ======================================
                            EMPLOYMENT
                        ====================================== */}

                            <div className="form-section">

                                <div className="form-section-title">

                                    <span>
                                        03
                                    </span>

                                    <div>

                                        <h3>
                                            Employment & Income
                                        </h3>

                                        <p>
                                            Provide your current
                                            income and employment
                                            details.
                                        </p>

                                    </div>

                                </div>


                                <div className="application-grid">


                                    <div className="form-group">

                                        <label>
                                            Monthly Income
                                        </label>


                                        <div className="input-with-symbol">

                                            <span>
                                                ₹
                                            </span>


                                            <input
                                                type="number"
                                                name="income"
                                                placeholder="Enter monthly income"
                                                value={
                                                    formData.income
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                min="1"
                                                required
                                            />

                                        </div>

                                    </div>


                                    <div className="form-group">

                                        <label>
                                            Employment Type
                                        </label>


                                        <select
                                            name="employment"
                                            value={
                                                formData.employment
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                        >

                                            <option value="">
                                                Select Employment
                                            </option>

                                            <option value="Salaried">
                                                Salaried
                                            </option>

                                            <option value="Self Employed">
                                                Self Employed
                                            </option>

                                            <option value="Business">
                                                Business
                                            </option>

                                            <option value="Student">
                                                Student
                                            </option>

                                            <option value="Other">
                                                Other
                                            </option>

                                        </select>

                                    </div>


                                    <div className="form-group full-width">

                                        <label>
                                            Family / Alternate Mobile Number
                                        </label>


                                        <input
                                            type="tel"
                                            name="familyPhone"
                                            placeholder="Enter alternate mobile number"
                                            value={
                                                formData.familyPhone
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            maxLength={10}
                                            inputMode="numeric"
                                            required
                                        />

                                    </div>

                                </div>

                            </div>


                            {/* ======================================
                            DOCUMENTS
                        ====================================== */}

                            <div className="form-section">

                                <div className="form-section-title">

                                    <span>
                                        04
                                    </span>

                                    <div>

                                        <h3>
                                            Identity Documents
                                        </h3>

                                        <p>
                                            Upload clear JPG,
                                            PNG or PDF documents.
                                            Maximum 5 MB each.
                                        </p>

                                    </div>

                                </div>


                                <div className="document-grid">


                                    {/* AADHAAR FRONT */}

                                    <div className="document-upload">

                                        <label>
                                            Aadhaar Card — Front
                                        </label>


                                        <div className="upload-box">

                                            <span className="upload-icon">
                                                📄
                                            </span>


                                            <strong>

                                                {
                                                    fileName(
                                                        formData.aadhaarFront,
                                                        "Upload Aadhaar Front"
                                                    )
                                                }

                                            </strong>


                                            <small>
                                                JPG, PNG or PDF • Max 5 MB
                                            </small>


                                            <input
                                                type="file"
                                                name="aadhaarFront"
                                                accept="image/*,.pdf"
                                                onChange={
                                                    handleFileChange
                                                }
                                                required
                                            />

                                        </div>

                                    </div>


                                    {/* AADHAAR BACK */}

                                    <div className="document-upload">

                                        <label>
                                            Aadhaar Card — Back
                                        </label>


                                        <div className="upload-box">

                                            <span className="upload-icon">
                                                📄
                                            </span>


                                            <strong>

                                                {
                                                    fileName(
                                                        formData.aadhaarBack,
                                                        "Upload Aadhaar Back"
                                                    )
                                                }

                                            </strong>


                                            <small>
                                                JPG, PNG or PDF • Max 5 MB
                                            </small>


                                            <input
                                                type="file"
                                                name="aadhaarBack"
                                                accept="image/*,.pdf"
                                                onChange={
                                                    handleFileChange
                                                }
                                                required
                                            />

                                        </div>

                                    </div>


                                    {/* PAN */}

                                    <div className="document-upload">

                                        <label>
                                            PAN Card
                                        </label>


                                        <div className="upload-box">

                                            <span className="upload-icon">
                                                📄
                                            </span>


                                            <strong>

                                                {
                                                    fileName(
                                                        formData.panCard,
                                                        "Upload PAN Card"
                                                    )
                                                }

                                            </strong>


                                            <small>
                                                JPG, PNG or PDF • Max 5 MB
                                            </small>


                                            <input
                                                type="file"
                                                name="panCard"
                                                accept="image/*,.pdf"
                                                onChange={
                                                    handleFileChange
                                                }
                                                required
                                            />

                                        </div>

                                    </div>


                                    {/* PASSBOOK */}

                                    <div className="document-upload">

                                        <label>
                                            Bank Passbook
                                        </label>


                                        <div className="upload-box">

                                            <span className="upload-icon">
                                                🏦
                                            </span>


                                            <strong>

                                                {
                                                    fileName(
                                                        formData.bankPassbook,
                                                        "Upload Bank Passbook"
                                                    )
                                                }

                                            </strong>


                                            <small>
                                                JPG, PNG or PDF • Max 5 MB
                                            </small>


                                            <input
                                                type="file"
                                                name="bankPassbook"
                                                accept="image/*,.pdf"
                                                onChange={
                                                    handleFileChange
                                                }
                                                required
                                            />

                                        </div>

                                    </div>

                                </div>

                            </div>


                            {/* ======================================
                            BANK DETAILS
                        ====================================== */}

                            <div className="form-section">

                                <div className="form-section-title">

                                    <span>
                                        05
                                    </span>

                                    <div>

                                        <h3>
                                            Bank Details
                                        </h3>

                                        <p>
                                            Required for loan
                                            disbursement.
                                        </p>

                                    </div>

                                </div>


                                <div className="application-grid">


                                    <div className="form-group">

                                        <label>
                                            Bank Account Number
                                        </label>


                                        <input
                                            type="text"
                                            name="bankAccountNumber"
                                            placeholder="Enter bank account number"
                                            value={
                                                formData.bankAccountNumber
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            inputMode="numeric"
                                            required
                                        />

                                    </div>


                                    <div className="form-group">

                                        <label>
                                            IFSC Code
                                        </label>


                                        <input
                                            type="text"
                                            name="ifscCode"
                                            placeholder="Enter 11-character IFSC"
                                            value={
                                                formData.ifscCode
                                            }
                                            onChange={(e) =>

                                                setFormData(
                                                    (prev) => ({

                                                        ...prev,

                                                        ifscCode:

                                                            e.target.value
                                                                .toUpperCase()
                                                                .replace(
                                                                    /[^A-Z0-9]/g,
                                                                    ""
                                                                )
                                                                .slice(
                                                                    0,
                                                                    11
                                                                ),

                                                    })
                                                )

                                            }
                                            maxLength={11}
                                            required
                                        />

                                    </div>

                                </div>

                            </div>


                            {/* ======================================
                            SELFIE
                        ====================================== */}

                            <div className="form-section">

                                <div className="form-section-title">

                                    <span>
                                        06
                                    </span>

                                    <div>

                                        <h3>
                                            Selfie Verification
                                        </h3>

                                        <p>
                                            Upload a clear recent
                                            photo for identity
                                            verification.
                                        </p>

                                    </div>

                                </div>


                                <div className="selfie-upload-box">

                                    <div className="selfie-upload-icon">
                                        👤
                                    </div>


                                    <h4>

                                        {
                                            formData.selfie
                                                ? formData.selfie.name
                                                : "Upload Your Selfie"
                                        }

                                    </h4>


                                    <p>
                                        JPG, JPEG or PNG • Maximum 5 MB
                                    </p>


                                    <label
                                        htmlFor="selfie"
                                        className="selfie-upload-btn"
                                    >
                                        📷 Choose Selfie Photo
                                    </label>


                                    <input
                                        id="selfie"
                                        type="file"
                                        name="selfie"
                                        accept="image/jpeg,image/jpg,image/png"
                                        onChange={
                                            handleSelfieChange
                                        }
                                        required={
                                            !formData.selfie
                                        }
                                    />

                                </div>


                                {formData.selfie && (

                                    <div className="selfie-preview-card">

                                        <img
                                            src={
                                                URL.createObjectURL(
                                                    formData.selfie
                                                )
                                            }
                                            alt="Selfie preview"
                                            className="selfie-preview-image"
                                        />


                                        <div className="selfie-preview-info">

                                            <strong>
                                                ✓ Selfie selected successfully
                                            </strong>


                                            <span>
                                                {
                                                    formData.selfie.name
                                                }
                                            </span>

                                        </div>


                                        <button
                                            type="button"
                                            className="remove-selfie-btn"
                                            onClick={
                                                removeSelfie
                                            }
                                        >
                                            Remove
                                        </button>

                                    </div>

                                )}

                            </div>


                            {/* ======================================
                            ELIGIBILITY
                        ====================================== */}

                            <div className="eligibility-box">

                                <div>

                                    <span className="mini-label">
                                        FINAL CHECK
                                    </span>


                                    <h3>
                                        Check Your Eligibility
                                    </h3>


                                    <p>
                                        Compare your requested
                                        loan amount with your
                                        monthly income.
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    className="eligibility-btn"
                                    onClick={
                                        checkEligibility
                                    }
                                >
                                    Check Eligibility
                                </button>

                            </div>


                            {eligibility && (

                                <div
                                    className={
                                        `eligibility-message ${eligibility.status}`
                                    }
                                >

                                    <strong>

                                        {
                                            eligibility.status ===
                                                "success"

                                                ? "✓ Eligible"

                                                : eligibility.status ===
                                                    "warning"

                                                    ? "⚠ Further Assessment"

                                                    : "✕ Check Details"
                                        }

                                    </strong>


                                    <p>
                                        {
                                            eligibility.message
                                        }
                                    </p>

                                </div>

                            )}


                            {/* ======================================
                            TERMS
                        ====================================== */}

                            <label className="terms-check">

                                <input
                                    type="checkbox"
                                    checked={
                                        termsAccepted
                                    }
                                    onChange={(e) =>
                                        setTermsAccepted(
                                            e.target.checked
                                        )
                                    }
                                />


                                <span>

                                    I confirm that all the
                                    information and documents
                                    provided are accurate and
                                    genuine. I agree to the{" "}

                                    <strong>
                                        Terms & Conditions
                                    </strong>

                                    {" "}
                                    and authorize the verification
                                    of the information submitted
                                    with this application.

                                </span>

                            </label>


                            {/* ======================================
                            SECURITY
                        ====================================== */}

                            <div className="secure-note">

                                <span>
                                    🔒
                                </span>


                                <div>

                                    <strong>
                                        Your information is secure
                                    </strong>


                                    <p>
                                        Your application details
                                        and uploaded documents
                                        are submitted securely
                                        for application processing.
                                    </p>

                                </div>

                            </div>


                            {/* ======================================
                            SUBMIT
                        ====================================== */}

                            <button
                                type="submit"
                                className="application-submit"
                                disabled={
                                    isSubmitting
                                }
                            >

                                {
                                    isSubmitting

                                        ? "Submitting Application..."

                                        : "Submit Loan Application →"
                                }

                            </button>


                            <p className="submit-note">
                                Please review all your
                                details before submitting.
                            </p>


                        </form>
                    )}
                </div>

            </section>


        </main >

    );

}

export default LoanApplication;