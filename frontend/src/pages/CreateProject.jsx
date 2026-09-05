 import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function CreateProject() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        projectId: "",
        name: "",
        description: "",
        village: "",
        district: "",
        officer: ""
    });

    const [officers, setOfficers] = useState([]);
    const [officersLoading, setOfficersLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchOfficers();
    }, []);

    const getAuthConfig = () => {
        const token = localStorage.getItem("token");

        if (!token) {
            throw new Error("Admin login required.");
        }

        return {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
    };

    const fetchOfficers = async () => {
        try {
            setOfficersLoading(true);
            setError("");

            const response = await API.get(
                "/auth/officers",
                getAuthConfig()
            );

            setOfficers(response.data?.officers || []);
        } catch (err) {
            console.error("Failed to load officers:", err);

            setOfficers([]);

            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to load available officers."
            );
        } finally {
            setOfficersLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));

        if (error) {
            setError("");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess(null);

        if (
            !form.projectId.trim() ||
            !form.name.trim() ||
            !form.village.trim() ||
            !form.district.trim() ||
            !form.officer
        ) {
            setError(
                "Please fill all required fields and select an officer."
            );
            return;
        }

        try {
            setLoading(true);

            const response = await API.post(
                "/projects",
                {
                    projectId: form.projectId.trim(),
                    name: form.name.trim(),
                    description: form.description.trim(),
                    village: form.village.trim(),
                    district: form.district.trim(),
                    officer: form.officer
                },
                getAuthConfig()
            );

            setSuccess(response.data);
        } catch (err) {
            console.error("Create project failed:", err);

            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to create project."
            );
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="create-project-page">
                <div className="create-success">
                    <div className="success-icon">✓</div>

                    <h2>Project Created Successfully</h2>

                    <p>
                        The project has been registered successfully.
                    </p>

                    <div className="success-details">
                        <div>
                            <span>Project ID</span>
                            <strong>
                                {success.project?.projectId ||
                                    form.projectId}
                            </strong>
                        </div>

                        <div>
                            <span>Assigned Officer</span>
                            <strong>{form.officer}</strong>
                        </div>

                        <div>
                            <span>Blockchain Project ID</span>
                            <strong>
                                {success.blockchain?.projectId ||
                                    success.project?.blockchainProjectId ||
                                    "Confirmed"}
                            </strong>
                        </div>

                        <div>
                            <span>Transaction Hash</span>
                            <code>
                                {success.blockchain?.transactionHash ||
                                    success.project?.blockchainTransactionHash ||
                                    "Available on blockchain"}
                            </code>
                        </div>

                        <div>
                            <span>Blockchain Status</span>
                            <strong className="success-status">
                                {success.project?.blockchainStatus ||
                                    "CONFIRMED"}
                            </strong>
                        </div>
                    </div>

                    <div
                        className="allocation-notice"
                        style={{
                            marginTop: "24px",
                            padding: "16px",
                            borderRadius: "10px",
                            background: "#f0f7ff",
                            border: "1px solid #cfe3ff"
                        }}
                    >
                        <strong>Next Step: Allocate Funds</strong>

                        <p style={{ margin: "8px 0 0" }}>
                            The project was created with no funds allocated.
                            Open the project details page to allocate the
                            government funds.
                        </p>
                    </div>

                    <div className="success-actions">
                        <button
                            className="action-button primary"
                            onClick={() => navigate("/projects")}
                        >
                            View All Projects
                        </button>

                        <button
                            className="action-button"
                            onClick={() =>
                                navigate(
                                    `/projects/${
                                        success.project?.projectId ||
                                        form.projectId
                                    }`
                                )
                            }
                        >
                            Open Project
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="create-project-page">
            <div className="create-project-header">
                <button
                    className="back-button"
                    onClick={() => navigate("/projects")}
                >
                    ← Back to Projects
                </button>

                <h1>Create Government Project</h1>

                <p>
                    Register a new government project on the blockchain.
                </p>
            </div>

            <form
                className="create-project-form"
                onSubmit={handleSubmit}
            >
                <section className="form-section">
                    <div className="form-section-header">
                        <h2>Project Information</h2>
                        <p>
                            Enter the basic details of the government project.
                        </p>
                    </div>

                    <div className="form-grid">
                        <div className="form-field">
                            <label>Project ID *</label>

                            <input
                                type="text"
                                name="projectId"
                                placeholder="Example: PRJ018"
                                value={form.projectId}
                                onChange={handleChange}
                            />

                            <small>
                                Use a unique project identifier.
                            </small>
                        </div>

                        <div className="form-field">
                            <label>Project Name *</label>

                            <input
                                type="text"
                                name="name"
                                placeholder="Example: Village Road Improvement"
                                value={form.name}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field full-width">
                            <label>Description</label>

                            <textarea
                                name="description"
                                rows="4"
                                placeholder="Describe the purpose and scope of the project..."
                                value={form.description}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </section>

                <section className="form-section">
                    <div className="form-section-header">
                        <h2>Project Location</h2>
                        <p>
                            Specify where the project will be implemented.
                        </p>
                    </div>

                    <div className="form-grid">
                        <div className="form-field">
                            <label>Village *</label>

                            <input
                                type="text"
                                name="village"
                                placeholder="Example: ABC Village"
                                value={form.village}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label>District *</label>

                            <input
                                type="text"
                                name="district"
                                placeholder="Example: Bengaluru Rural"
                                value={form.district}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </section>

                <section className="form-section">
                    <div className="form-section-header">
                        <h2>Project Officer</h2>

                        <p>
                            Select a registered Officer responsible for
                            monitoring the project and recording expenses.
                        </p>
                    </div>

                    <div className="form-grid">
                        <div className="form-field">
                            <label>Assigned Officer *</label>

                            <select
                                name="officer"
                                value={form.officer}
                                onChange={handleChange}
                                disabled={
                                    officersLoading || loading
                                }
                            >
                                <option value="">
                                    {officersLoading
                                        ? "Loading officers..."
                                        : officers.length === 0
                                            ? "No officers available"
                                            : "Select an officer"}
                                </option>

                                {officers.map((officer) => (
                                    <option
                                        key={
                                            officer._id ||
                                            officer.username
                                        }
                                        value={officer.username}
                                    >
                                        {officer.username}
                                    </option>
                                ))}
                            </select>

                            <small>
                                Only registered Officer accounts can be
                                assigned to a project.
                            </small>
                        </div>
                    </div>

                    {!officersLoading &&
                        officers.length === 0 && (
                            <div
                                style={{
                                    marginTop: "12px",
                                    padding: "12px",
                                    borderRadius: "8px",
                                    background: "#fff7ed",
                                    border: "1px solid #fed7aa"
                                }}
                            >
                                No Officer accounts are available.
                                Create an Officer account before assigning
                                this project.
                            </div>
                        )}
                </section>

                {error && (
                    <div className="create-error">
                        ⚠ {error}
                    </div>
                )}

                <div className="create-form-actions">
                    <button
                        type="button"
                        className="cancel-button"
                        onClick={() => navigate("/projects")}
                        disabled={loading}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="action-button primary"
                        disabled={
                            loading ||
                            officersLoading ||
                            officers.length === 0
                        }
                    >
                        {loading
                            ? "Creating Project..."
                            : "Create Project"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CreateProject;