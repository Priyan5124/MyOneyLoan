import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Login.css";
import "./Register.css";


function Register() {

    const navigate = useNavigate();


    // ==========================================
    // FORM STATES
    // ==========================================

    const [fullName, setFullName] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [phone, setPhone] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");


    // ==========================================
    // OTP STATES
    // ==========================================

    const [otp, setOtp] =
        useState("");

    const [showOtpPopup, setShowOtpPopup] =
        useState(false);

    const [otpVerified, setOtpVerified] =
        useState(false);


    // ==========================================
    // LOADING
    // ==========================================

    const [loading, setLoading] =
        useState(false);

    const [otpLoading, setOtpLoading] =
        useState(false);


    // ==========================================
    // SEND OTP
    // ==========================================

    const handleSendOtp = async () => {

        if (
            !phone ||
            !/^[6-9]\d{9}$/.test(phone)
        ) {

            alert(
                "Enter a valid 10-digit mobile number."
            );

            return;
        }


        try {

            setOtpLoading(true);


            const response =
                await fetch(
                    "https://myoneyloan.onrender.com/api/auth/send-otp",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            phone,
                        }),
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to send OTP."
                );

            }


            // ======================================
            // OTP ALERT
            // ======================================

            if (
                data.success &&
                data.otp
            ) {

                alert(
                    `Your OTP is: ${data.otp}`
                );


                // Clear previous OTP
                setOtp("");


                // Open OTP popup
                setShowOtpPopup(true);

            } else {

                throw new Error(
                    "OTP was not generated."
                );

            }

        } catch (error) {

            console.error(
                "Send OTP error:",
                error
            );

            alert(
                error.message ||
                "Unable to send OTP."
            );

        } finally {

            setOtpLoading(false);

        }

    };


    // ==========================================
    // VERIFY OTP
    // ==========================================

    const handleVerifyOtp = async () => {

        if (
            !otp ||
            otp.length !== 6
        ) {

            alert(
                "Please enter the 6-digit OTP."
            );

            return;
        }


        try {

            setOtpLoading(true);


            const response =
                await fetch(
                    "https://myoneyloan.onrender.com/api/auth/verify-otp",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({

                            phone,

                            otp,

                        }),
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Invalid OTP."
                );

            }


            setOtpVerified(true);

            setShowOtpPopup(false);


            alert(
                "Mobile number verified successfully!"
            );

        } catch (error) {

            console.error(
                "OTP verification error:",
                error
            );

            alert(
                error.message ||
                "OTP verification failed."
            );

        } finally {

            setOtpLoading(false);

        }

    };


    // ==========================================
    // REGISTER
    // ==========================================

    const handleSubmit = async (e) => {

        e.preventDefault();


        if (
            !fullName ||
            !email ||
            !phone ||
            !password ||
            !confirmPassword
        ) {

            alert(
                "Please fill all fields."
            );

            return;
        }


        if (
            password !==
            confirmPassword
        ) {

            alert(
                "Password and Confirm Password do not match."
            );

            return;
        }


        if (!otpVerified) {

            alert(
                "Please verify your mobile number first."
            );

            return;
        }


        try {

            setLoading(true);


            const response =
                await fetch(
                    "https://myoneyloan.onrender.com/api/auth/register",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({

                            fullName,

                            email,

                            phone,

                            password,

                        }),
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Registration failed."
                );

            }


            // ======================================
            // SAVE TOKEN
            // ======================================

            if (data.token) {

                localStorage.setItem(
                    "token",
                    data.token
                );
                // New user registration - old processing status remove
                if (data.user?.id) {
                    localStorage.removeItem(
                        `loanProcessing_${data.user.id}`
                    );
                }

            }


            // ======================================
            // SAVE USER
            // ======================================

            if (data.user) {

                localStorage.setItem(
                    "user",
                    JSON.stringify(
                        data.user
                    )
                );

            }


            alert(
                "Registration successful!"
            );


            navigate("/", {
                replace: true,
            });

        } catch (error) {

            console.error(
                "Registration error:",
                error
            );

            alert(
                error.message ||
                "Registration failed."
            );

        } finally {

            setLoading(false);

        }

    };


    // ==========================================
    // PHONE CHANGE
    // ==========================================

    const handlePhoneChange = (e) => {

        const value =
            e.target.value.replace(
                /\D/g,
                ""
            );


        setPhone(value);

        setOtpVerified(false);

    };


    return (

        <main className="auth-page">

            <div className="auth-card">

                <h1>
                    Create Account
                </h1>

                <p>
                    Register to apply for a loan.
                </p>


                <form
                    onSubmit={handleSubmit}
                >

                    {/* FULL NAME */}

                    <input
                        type="text"
                        placeholder="Full Name"
                        value={fullName}
                        onChange={(e) =>
                            setFullName(
                                e.target.value
                            )
                        }
                        required
                    />


                    {/* EMAIL */}

                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) =>
                            setEmail(
                                e.target.value
                            )
                        }
                        required
                    />


                    {/* PHONE + OTP */}

                    <div className="phone-otp-row">

                        <input
                            type="text"
                            placeholder="Mobile Number"
                            value={phone}
                            maxLength={10}
                            onChange={
                                handlePhoneChange
                            }
                            required
                        />


                        <button
                            type="button"
                            onClick={
                                handleSendOtp
                            }
                            disabled={
                                otpLoading ||
                                otpVerified
                            }
                        >

                            {otpVerified
                                ? "Verified ✓"
                                : otpLoading
                                    ? "Sending..."
                                    : "Send OTP"
                            }

                        </button>

                    </div>


                    {/* PASSWORD */}

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) =>
                            setPassword(
                                e.target.value
                            )
                        }
                        required
                    />


                    {/* CONFIRM PASSWORD */}

                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={
                            confirmPassword
                        }
                        onChange={(e) =>
                            setConfirmPassword(
                                e.target.value
                            )
                        }
                        required
                    />


                    {/* REGISTER */}

                    <button
                        type="submit"
                        disabled={loading}
                    >

                        {loading
                            ? "Creating Account..."
                            : "Register"
                        }

                    </button>

                </form>


                {/* LOGIN */}

                <p className="register-link">

                    Already have an account?

                    {" "}

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/login")
                        }
                    >
                        Login
                    </button>

                </p>

            </div>


            {/* ==========================================
                OTP POPUP
            ========================================== */}

            {showOtpPopup && (

                <div className="otp-popup-overlay">

                    <div className="otp-popup">

                        <button
                            className="otp-close"
                            type="button"
                            onClick={() =>
                                setShowOtpPopup(false)
                            }
                        >
                            ×
                        </button>


                        <h2>
                            Verify Mobile Number
                        </h2>


                        <p>
                            Enter the OTP for
                        </p>


                        <strong>
                            {phone}
                        </strong>


                        <input
                            className="otp-input"
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            maxLength={6}
                            onChange={(e) =>
                                setOtp(
                                    e.target.value.replace(
                                        /\D/g,
                                        ""
                                    )
                                )
                            }
                            autoFocus
                        />


                        <button
                            type="button"
                            className="verify-otp-btn"
                            onClick={
                                handleVerifyOtp
                            }
                            disabled={
                                otpLoading
                            }
                        >

                            {otpLoading
                                ? "Verifying..."
                                : "Verify OTP"
                            }

                        </button>

                    </div>

                </div>

            )}

        </main>

    );

}


export default Register;