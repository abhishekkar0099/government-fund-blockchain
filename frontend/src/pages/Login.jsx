import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import API from "../services/api";

function Login() {

    const navigate = useNavigate();

    const [role, setRole] =
        useState("ADMIN");

    const [username, setUsername] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);


    // ==========================================
    // LOGIN
    // ==========================================

    const handleLogin = async (e) => {

        e.preventDefault();

        setError("");

        if (
            !username.trim() ||
            !password
        ) {

            setError(
                "Please enter username and password."
            );

            return;
        }


        try {

            setLoading(true);


            // ======================================
            // BACKEND LOGIN
            // ======================================

            const response =
                await API.post(
                    "/auth/login",
                    {
                        username:
                            username.trim(),

                        password
                    }
                );


            const {
                token,
                user
            } = response.data;


            // ======================================
            // CHECK ROLE
            // ======================================

            if (
                !user ||
                !user.role
            ) {

                setError(
                    "Invalid user information received from server."
                );

                return;
            }


            const loggedInRole =
                user.role.toUpperCase();


            // ======================================
            // VERIFY SELECTED ROLE
            // ======================================

            if (
                loggedInRole !== role
            ) {

                setError(
                    `This account is registered as ${loggedInRole}. Please select ${loggedInRole}.`
                );

                return;
            }


            // ======================================
            // SAVE LOGIN INFORMATION
            // ======================================

            localStorage.setItem(
                "token",
                token
            );

            localStorage.setItem(
                "userRole",
                loggedInRole
            );

            localStorage.setItem(
                "username",
                user.username
            );

            localStorage.setItem(
                "isLoggedIn",
                "true"
            );


            // ======================================
            // ROLE-BASED REDIRECT
            // ======================================

            if (
                loggedInRole === "CITIZEN"
            ) {

                navigate("/citizen");

            } else {

                // ADMIN
                // OFFICER

                navigate("/");

            }


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            setError(
                error.response?.data?.message ||
                "Invalid username or password."
            );


        } finally {

            setLoading(false);

        }

    };


    return (

        <div className="login-page">

            <div className="login-container">


                {/* ======================================
                    HEADER
                ====================================== */}

                <div className="login-header">

                    <div className="login-icon">
                        ⛓
                    </div>

                    <h1>
                        Government Fund Portal
                    </h1>

                    <p>
                        Blockchain-Based Fund
                        Allocation & Tracking System
                    </p>

                </div>


                {/* ======================================
                    LOGIN CARD
                ====================================== */}

                <div className="login-card">

                    <h2>
                        Welcome Back
                    </h2>

                    <p className="login-subtitle">
                        Sign in to continue
                    </p>


                    <form
                        onSubmit={handleLogin}
                    >


                        {/* ==================================
                            ROLE
                        ================================== */}

                        <div className="login-field">

                            <label>
                                Login As
                            </label>

                            <select
                                value={role}
                                onChange={(e) => {

                                    setRole(
                                        e.target.value
                                    );

                                    setError("");

                                }}
                            >

                                <option value="ADMIN">
                                    Admin
                                </option>

                                <option value="OFFICER">
                                    Officer
                                </option>

                                <option value="CITIZEN">
                                    Citizen
                                </option>

                            </select>

                        </div>


                        {/* ==================================
                            USERNAME
                        ================================== */}

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
                                autoComplete="username"
                                required
                            />

                        </div>


                        {/* ==================================
                            PASSWORD
                        ================================== */}

                        <div className="login-field">

                            <label>
                                Password
                            </label>

                            <input
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(
                                        e.target.value
                                    )
                                }
                                autoComplete="current-password"
                                required
                            />

                        </div>


                        {/* ==================================
                            ERROR
                        ================================== */}

                        {error && (

                            <div className="login-error">

                                ⚠ {error}

                            </div>

                        )}


                        {/* ==================================
                            LOGIN BUTTON
                        ================================== */}

                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading}
                        >

                            {loading
                                ? "Signing in..."
                                : "Login"}

                        </button>

                    </form>


                    {/* ==================================
                        CITIZEN REGISTRATION
                    ================================== */}

                    <div
                        style={{
                            marginTop: "22px",
                            textAlign: "center"
                        }}
                    >

                        New citizen?

                        {" "}

                        <Link
                            to="/register"
                            style={{
                                fontWeight: "600",
                                textDecoration:
                                    "none"
                            }}
                        >
                            Create Account
                        </Link>

                    </div>


                    {/* ==================================
                        ROLE INFORMATION
                    ================================== */}

                    <div className="role-info">

                        <div>

                            <strong>
                                Admin
                            </strong>

                            <span>
                                Manage government
                                funds
                            </span>

                        </div>


                        <div>

                            <strong>
                                Officer
                            </strong>

                            <span>
                                Record project
                                expenses
                            </span>

                        </div>


                        <div>

                            <strong>
                                Citizen
                            </strong>

                            <span>
                                View and verify
                                projects
                            </span>

                        </div>

                    </div>

                </div>


                {/* ======================================
                    BLOCKCHAIN STATUS
                ====================================== */}

                <div className="blockchain-status">

                    <span className="status-dot">
                        ●
                    </span>

                    Blockchain-secured
                    government fund portal

                </div>

            </div>

        </div>

    );

}

export default Login;