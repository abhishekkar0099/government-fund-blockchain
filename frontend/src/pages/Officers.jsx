import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Officers() {
    const navigate = useNavigate();

    const [officers, setOfficers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [formLoading, setFormLoading] =
        useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // =========================================
    // AUTH CONFIG
    // =========================================

    const getAuthConfig = () => {

        const token =
            localStorage.getItem("token");

        if (!token) {
            throw new Error(
                "Admin login required."
            );
        }

        return {
            headers: {
                Authorization:
                    `Bearer ${token}`
            }
        };
    };

    // =========================================
    // LOAD OFFICERS
    // =========================================

    const fetchOfficers = async () => {

        try {

            setLoading(true);
            setError("");

            const response =
                await API.get(
                    "/auth/officers",
                    getAuthConfig()
                );

            setOfficers(
                response.data?.officers || []
            );

        } catch (err) {

            console.error(
                "Failed to load officers:",
                err
            );

            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to load officers."
            );

        } finally {

            setLoading(false);

        }
    };

    useEffect(() => {

        fetchOfficers();

    }, []);

    // =========================================
    // CREATE OFFICER
    // =========================================

    const handleCreateOfficer = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");

        if (
            !username.trim() ||
            !password ||
            !confirmPassword
        ) {

            setError(
                "Please fill all fields."
            );

            return;
        }

        if (
            username.trim().length < 3
        ) {

            setError(
                "Username must contain at least 3 characters."
            );

            return;
        }

        if (password.length < 6) {

            setError(
                "Password must contain at least 6 characters."
            );

            return;
        }

        if (
            password !== confirmPassword
        ) {

            setError(
                "Passwords do not match."
            );

            return;
        }

        try {

            setFormLoading(true);

            const response =
                await API.post(
                    "/auth/officers",
                    {
                        username:
                            username.trim(),

                        password
                    },
                    getAuthConfig()
                );

            setSuccess(
                response.data?.message ||
                "Officer created successfully."
            );

            setUsername("");
            setPassword("");
            setConfirmPassword("");

            setShowForm(false);

            await fetchOfficers();

        } catch (err) {

            console.error(
                "Create officer failed:",
                err
            );

            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to create officer."
            );

        } finally {

            setFormLoading(false);

        }
    };

    // =========================================
    // UI
    // =========================================

    return (
        <div className="dashboard-page">

            {/* HEADER */}

            <div className="dashboard-header">

                <div>

                    <button
                        className="back-button"
                        onClick={() =>
                            navigate("/")
                        }
                    >
                        ← Dashboard
                    </button>

                    <h1>
                        Officer Management
                    </h1>

                    <p>
                        Manage government officers
                        responsible for project monitoring
                        and expense recording.
                    </p>

                </div>

                <button
                    className="action-button primary"
                    onClick={() => {

                        setShowForm(
                            !showForm
                        );

                        setError("");
                        setSuccess("");

                    }}
                >
                    {showForm
                        ? "Cancel"
                        : "+ Add Officer"}
                </button>

            </div>


            {/* SUCCESS */}

            {success && (

                <div
                    style={{
                        marginBottom: "20px",
                        padding: "14px 18px",
                        borderRadius: "10px",
                        background: "#ecfdf5",
                        border:
                            "1px solid #a7f3d0",
                        color: "#065f46"
                    }}
                >

                    ✓ {success}

                </div>

            )}


            {/* ERROR */}

            {error && (

                <div
                    className="create-error"
                    style={{
                        marginBottom: "20px"
                    }}
                >

                    ⚠ {error}

                </div>

            )}


            {/* CREATE FORM */}

            {showForm && (

                <section
                    className="projects-panel"
                    style={{
                        marginBottom: "24px"
                    }}
                >

                    <div className="panel-header">

                        <div>

                            <h3>
                                Add Government Officer
                            </h3>

                            <p>
                                Create an account for a
                                project monitoring officer.
                            </p>

                        </div>

                    </div>


                    <form
                        onSubmit={
                            handleCreateOfficer
                        }
                    >

                        <div
                            className="form-grid"
                        >

                            <div
                                className="form-field"
                            >

                                <label>
                                    Username *
                                </label>

                                <input
                                    type="text"
                                    placeholder="Example: officer002"
                                    value={username}
                                    onChange={(e) =>
                                        setUsername(
                                            e.target.value
                                        )
                                    }
                                    disabled={
                                        formLoading
                                    }
                                />

                            </div>


                            <div
                                className="form-field"
                            >

                                <label>
                                    Password *
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
                                    disabled={
                                        formLoading
                                    }
                                />

                            </div>


                            <div
                                className="form-field"
                            >

                                <label>
                                    Confirm Password *
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
                                    disabled={
                                        formLoading
                                    }
                                />

                            </div>

                        </div>


                        <div
                            style={{
                                marginTop: "20px"
                            }}
                        >

                            <button
                                type="submit"
                                className="action-button primary"
                                disabled={
                                    formLoading
                                }
                            >
                                {formLoading
                                    ? "Creating Officer..."
                                    : "Create Officer"}
                            </button>

                        </div>

                    </form>

                </section>

            )}


            {/* OFFICER LIST */}

            <section className="projects-panel">

                <div className="panel-header">

                    <div>

                        <h3>
                            Registered Officers
                        </h3>

                        <p>
                            Officers available for
                            government project assignment.
                        </p>

                    </div>

                    <strong>
                        {officers.length} Officer
                        {officers.length !== 1
                            ? "s"
                            : ""}
                    </strong>

                </div>


                {loading ? (

                    <div className="loading-state">

                        <div className="loading-spinner">
                            ⟳
                        </div>

                        <h3>
                            Loading officers...
                        </h3>

                    </div>

                ) : officers.length === 0 ? (

                    <div className="empty-state">

                        <div>
                            O
                        </div>

                        <h3>
                            No officers found
                        </h3>

                        <p>
                            Create your first government
                            officer using the Add Officer
                            button.
                        </p>

                    </div>

                ) : (

                    <div
                        className="project-table-wrapper"
                    >

                        <table
                            className="project-table"
                        >

                            <thead>

                                <tr>

                                    <th>
                                        Username
                                    </th>

                                    <th>
                                        Role
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {officers.map(
                                    (officer) => (

                                        <tr
                                            key={
                                                officer._id ||
                                                officer.username
                                            }
                                        >

                                            <td>
                                                <strong>
                                                    {
                                                        officer.username
                                                    }
                                                </strong>
                                            </td>

                                            <td>
                                                <span
                                                    className="status-badge"
                                                >
                                                    {
                                                        officer.role
                                                    }
                                                </span>
                                            </td>

                                            <td>

                                                <span
                                                    className="blockchain-badge"
                                                >
                                                    ● Active
                                                </span>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </section>

        </div>
    );
}

export default Officers;