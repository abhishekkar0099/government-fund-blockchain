import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import API from "../services/api";

function Register() {
    const navigate = useNavigate();

    const [username, setUsername] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [error, setError] =
        useState("");

    const [message, setMessage] =
        useState("");

    const [loading, setLoading] =
        useState(false);


    const handleRegister = async (e) => {
        e.preventDefault();

        setError("");
        setMessage("");

        if (
            password !==
            confirmPassword
        ) {
            setError(
                "Passwords do not match."
            );

            return;
        }

        if (password.length < 6) {
            setError(
                "Password must contain at least 6 characters."
            );

            return;
        }

        try {
            setLoading(true);

            const response =
                await API.post(
                    "/auth/register",
                    {
                        username,
                        password
                    }
                );

            setMessage(
                response.data.message ||
                "Citizen account created successfully."
            );

            setUsername("");
            setPassword("");
            setConfirmPassword("");

            setTimeout(() => {
                navigate("/login");
            }, 1500);

        } catch (error) {

            setError(
                error.response?.data?.message ||
                "Registration failed."
            );

        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="login-page">

            <div className="login-container">

                <div className="login-header">

                    <div className="login-icon">
                        👤
                    </div>

                    <h1>
                        Citizen Registration
                    </h1>

                    <p>
                        Create an account to
                        access government
                        project information.
                    </p>

                </div>


                <div className="login-card">

                    <h2>
                        Create Account
                    </h2>

                    <p className="login-subtitle">
                        Register as a citizen
                    </p>


                    <form
                        onSubmit={
                            handleRegister
                        }
                    >

                        <div className="login-field">

                            <label>
                                Username
                            </label>

                            <input
                                type="text"
                                placeholder="Enter username"
                                value={username}
                                onChange={(e) =>
                                    setUsername(
                                        e.target.value
                                    )
                                }
                                required
                            />

                        </div>


                        <div className="login-field">

                            <label>
                                Password
                            </label>

                            <input
                                type="password"
                                placeholder="Minimum 6 characters"
                                value={password}
                                onChange={(e) =>
                                    setPassword(
                                        e.target.value
                                    )
                                }
                                required
                            />

                        </div>


                        <div className="login-field">

                            <label>
                                Confirm Password
                            </label>

                            <input
                                type="password"
                                placeholder="Re-enter password"
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

                        </div>


                        {error && (
                            <div className="login-error">
                                ⚠ {error}
                            </div>
                        )}


                        {message && (
                            <div
                                className="login-success"
                            >
                                ✓ {message}
                            </div>
                        )}


                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading}
                        >
                            {loading
                                ? "Creating Account..."
                                : "Create Citizen Account"}
                        </button>

                    </form>


                    <div
                        style={{
                            marginTop: "22px",
                            textAlign: "center"
                        }}
                    >
                        Already have an account?

                        {" "}

                        <Link
                            to="/login"
                            style={{
                                fontWeight: "600",
                                textDecoration:
                                    "none"
                            }}
                        >
                            Login
                        </Link>
                    </div>

                </div>


                <div className="blockchain-status">

                    <span className="status-dot">
                        ●
                    </span>

                    Citizen accounts are
                    protected by the
                    Government Fund Portal

                </div>

            </div>

        </div>
    );
}

export default Register;