import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {

    const navigate = useNavigate();

    const [emailOrPhone, setEmailOrPhone] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);


    const handleSubmit = async (e) => {

        e.preventDefault();


        if (!emailOrPhone || !password) {

            alert(
                "Please enter email/phone and password."
            );

            return;
        }


        try {

            setLoading(true);


            // ======================================
            // ADMIN LOGIN
            // ======================================

            const adminEmail =
                "admin@myoney.com";

            const adminPassword =
                "Admin@123456";


            if (
                emailOrPhone.trim().toLowerCase() ===
                adminEmail.toLowerCase() &&
                password === adminPassword
            ) {

                // Save admin session

                localStorage.setItem(
                    "adminLoggedIn",
                    "true"
                );

                localStorage.setItem(
                    "adminEmail",
                    adminEmail
                );


                // Remove normal user session
                localStorage.removeItem(
                    "token"
                );

                localStorage.removeItem(
                    "user"
                );


                alert(
                    "Welcome Admin! Login successful."
                );


                navigate(
                    "/admin/dashboard",
                    {
                        replace: true,
                    }
                );


                return;
            }


            // ======================================
            // NORMAL USER LOGIN
            // ======================================

            const response = await fetch(
                "https://myoneyloan.onrender.com/api/auth/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({

                        emailOrPhone:
                            emailOrPhone.trim(),

                        password,

                    }),
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Login failed."
                );

            }


            // ======================================
            // CHECK TOKEN
            // ======================================

            if (!data.token) {

                throw new Error(
                    "Login successful, but token was not received from server."
                );

            }


            // ======================================
            // SAVE TOKEN
            // ======================================

            localStorage.setItem(
                "token",
                data.token
            );


            // ======================================
            // SAVE USER
            // ======================================

            if (data.user) {

                localStorage.setItem(
                    "user",
                    JSON.stringify(data.user)
                );

            }


            // Admin session remove

            localStorage.removeItem(
                "adminLoggedIn"
            );

            localStorage.removeItem(
                "adminEmail"
            );


            // ======================================
            // SUCCESS
            // ======================================

            alert(
                `Welcome ${data.user?.fullName ||
                "User"
                }! Login successful.`
            );


            // ======================================
            // USER HOME
            // ======================================

            navigate(
                "/apply",
                {
                    replace: true,
                }
            );


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            alert(
                error.message ||
                "Login failed. Please try again."
            );


        } finally {

            setLoading(false);

        }

    };


    return (

        <main className="auth-page">

            <div className="auth-card">

                <h1>
                    Welcome Back
                </h1>

                <p>
                    Login to continue your loan application.
                </p>


                <form
                    onSubmit={handleSubmit}
                >

                    <input
                        type="text"
                        placeholder="Email or Mobile Number"
                        value={emailOrPhone}
                        onChange={(e) =>
                            setEmailOrPhone(
                                e.target.value
                            )
                        }
                        required
                    />


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


                    <button
                        type="submit"
                        disabled={loading}
                    >

                        {loading
                            ? "Logging in..."
                            : "Login"
                        }

                    </button>

                </form>


                <p className="register-link">

                    Don't have an account?

                    {" "}

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/register")
                        }
                    >
                        Register
                    </button>

                </p>

            </div>

        </main>

    );

}

export default Login;