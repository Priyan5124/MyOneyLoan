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
            alert("Please enter ID/email/phone and password.");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                "http://localhost:5000/api/auth/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify({
                        emailOrPhone,
                        password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Login failed."
                );
            }

            if (!data.token) {
                throw new Error(
                    "Login successful, but token was not received."
                );
            }

            // Save token
            localStorage.setItem(
                "token",
                data.token
            );

            // ======================================
            // ADMIN LOGIN
            // ======================================

            if (data.user?.role === "admin") {

                localStorage.setItem(
                    "user",
                    JSON.stringify(data.user)
                );

                localStorage.setItem(
                    "isAdmin",
                    "true"
                );

                alert("Admin login successful!");

                navigate("/admin/dashboard", {
                    replace: true,
                });

                return;
            }

            // ======================================
            // NORMAL USER LOGIN
            // ======================================

            if (data.user) {
                localStorage.setItem(
                    "user",
                    JSON.stringify(data.user)
                );
            }

            localStorage.removeItem("isAdmin");

            alert(
                `Welcome ${data.user?.fullName || "User"}!`
            );

            navigate("/apply", {
                replace: true,
            });

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

                <form onSubmit={handleSubmit}>

                    <input
                        type="text"
                        placeholder="Email / Mobile / Admin ID"
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
                            : "Login"}
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