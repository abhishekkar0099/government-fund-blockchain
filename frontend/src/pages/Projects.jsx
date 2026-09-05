import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Projects() {
    const navigate = useNavigate();

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [officers, setOfficers] = useState([]);
    const [assigningProject, setAssigningProject] = useState(null);
    const [selectedOfficer, setSelectedOfficer] = useState("");
    const [assignmentLoading, setAssignmentLoading] = useState(false);
    const [assignmentError, setAssignmentError] = useState("");
    const [assignmentSuccess, setAssignmentSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    useEffect(() => {
        loadProjects();

        if (localStorage.getItem("userRole") === "ADMIN") {
            loadOfficers();
        }
    }, []);

    const loadProjects = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await API.get("/projects");

            console.log("Projects API response:", response.data);

            // Your backend returns the array directly
            if (Array.isArray(response.data)) {
                setProjects(response.data);
            } else {
                setProjects(
                    response.data.projects || []
                );
            }

        } catch (err) {
            console.error(
                "Failed to load projects:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to connect to the backend."
            );

        } finally {
            setLoading(false);
        }
    };

    const loadOfficers = async () => {
        try {
            const response = await API.get("/auth/officers");
            const list = Array.isArray(response.data)
                ? response.data
                : response.data?.officers || [];
            setOfficers(list);
        } catch (err) {
            console.error("Failed to load officers:", err);
            setOfficers([]);
            setError(
                err.response?.data?.message ||
                "Unable to load officers."
            );
        }
    };

    const openAssignOfficer = (project) => {
        setAssigningProject(project);
        setSelectedOfficer(project.officer || "");
        setAssignmentError("");
        setAssignmentSuccess("");
    };

    const closeAssignOfficer = () => {
        if (assignmentLoading) return;
        setAssigningProject(null);
        setSelectedOfficer("");
        setAssignmentError("");
        setAssignmentSuccess("");
    };

    const assignOfficer = async () => {
        if (!assigningProject) return;
        if (!selectedOfficer) {
            setAssignmentError("Please select an officer.");
            return;
        }
        try {
            setAssignmentLoading(true);
            setAssignmentError("");
            setAssignmentSuccess("");

            const response = await API.put(
                `/projects/${assigningProject.projectId}/assign`,
                { officer: selectedOfficer }
            );

            const updatedProject = response.data?.project || response.data;
            const officerName = updatedProject?.officer || selectedOfficer;

            setProjects((currentProjects) =>
                currentProjects.map((project) =>
                    project.projectId === assigningProject.projectId
                        ? { ...project, officer: officerName }
                        : project
                )
            );

            setAssigningProject((current) =>
                current ? { ...current, officer: officerName } : current
            );

            setAssignmentSuccess(
                response.data?.message ||
                `${assigningProject.projectId} assigned to ${officerName}.`
            );
        } catch (err) {
            console.error("ASSIGN OFFICER ERROR:", err);
            setAssignmentError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Failed to assign officer."
            );
        } finally {
            setAssignmentLoading(false);
        }
    };

    const formatMoney = (amount) => {
        return `₹${Number(
            amount || 0
        ).toLocaleString("en-IN")}`;
    };

    const getRemaining = (project) => {
        return (
            Number(project.releasedAmount || 0) -
            Number(project.spentAmount || 0)
        );
    };

    const filteredProjects = projects.filter(
        (project) => {

            const searchText =
                search.toLowerCase().trim();

            const matchesSearch =
                !searchText ||
                project.projectId
                    ?.toLowerCase()
                    .includes(searchText) ||
                project.name
                    ?.toLowerCase()
                    .includes(searchText) ||
                project.village
                    ?.toLowerCase()
                    .includes(searchText) ||
                project.district
                    ?.toLowerCase()
                    .includes(searchText);

            const matchesStatus =
                statusFilter === "ALL" ||
                project.status === statusFilter;

            return (
                matchesSearch &&
                matchesStatus
            );
        }
    );

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loader"></div>

                <p>
                    Loading projects...
                </p>
            </div>
        );
    }

    return (
        <div className="projects-page">

            {/* HEADER */}

            <header className="projects-header">

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
                        Government Projects
                    </h1>

                    <p>
                        View and monitor registered
                        government projects.
                    </p>

                </div>

            {localStorage.getItem("userRole") === "ADMIN" && (
                    <button
                        onClick={() => navigate("/projects/create")}
                        className="create-project-button"
                    >
                        + Create Project
                    </button>
                )}

            </header>


            {/* ERROR */}

            {error && (
                <div className="error-box">
                    ⚠ {error}

                    <button
                        onClick={loadProjects}
                        style={{
                            marginLeft: "15px",
                            border: "none",
                            background: "transparent",
                            color: "#315d96",
                            cursor: "pointer",
                            fontWeight: "600"
                        }}
                    >
                        Retry
                    </button>
                </div>
            )}


            {/* FILTER BAR */}

            <section className="filter-bar">

                <div className="search-box">

                    <span>
                        🔍
                    </span>

                    <input
                        type="text"
                        placeholder="Search project, village or district..."
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                    />

                </div>


                <select
                    value={statusFilter}
                    onChange={(e) =>
                        setStatusFilter(
                            e.target.value
                        )
                    }
                >

                    <option value="ALL">
                        All Status
                    </option>

                    <option value="PLANNED">
                        Planned
                    </option>

                    <option value="IN_PROGRESS">
                        In Progress
                    </option>

                    <option value="COMPLETED">
                        Completed
                    </option>

                </select>

            </section>


            {/* COUNT */}

            <div className="project-count">

                Showing{" "}
                <strong>
                    {filteredProjects.length}
                </strong>{" "}
                of{" "}
                <strong>
                    {projects.length}
                </strong>{" "}
                projects

            </div>


            {/* PROJECTS */}

            {filteredProjects.length === 0 ? (

                <div className="empty-projects">

                    <div>
                        📁
                    </div>

                    <h2>
                        No projects found
                    </h2>

                    <p>
                        Try changing your search
                        or status filter.
                    </p>

                </div>

            ) : (

                <div className="projects-grid">

                    {filteredProjects.map(
                        (project) => (

                            <div
                                className="project-card-large"
                                key={
                                    project.projectId
                                }
                            >

                                {/* HEADER */}

                                <div className="project-card-header">

                                    <div>

                                        <span className="project-id">
                                            {
                                                project.projectId
                                            }
                                        </span>

                                        <h2>
                                            {
                                                project.name
                                            }
                                        </h2>

                                    </div>

                                    <span
                                        className={
                                            `status-badge ${
                                                project.status ===
                                                "COMPLETED"
                                                    ? "completed"
                                                    : project.status ===
                                                      "IN_PROGRESS"
                                                    ? "progress-status"
                                                    : "planned"
                                            }`
                                        }
                                    >
                                        {
                                            project.status
                                        }
                                    </span>

                                </div>


                                {/* LOCATION */}

                                <div className="project-location">

                                    <span>
                                        📍{" "}
                                        {
                                            project.village
                                        }
                                    </span>

                                    <span>
                                        {
                                            project.district
                                        }
                                    </span>

                                </div>


                                {/* DESCRIPTION */}

                                <p className="project-description">

                                    {
                                        project.description ||
                                        "No description available."
                                    }

                                </p>


                                {/* MONEY */}

                                <div className="money-grid">

                                    <div>

                                        <span>
                                            Allocated
                                        </span>

                                        <strong>
                                            {
                                                formatMoney(
                                                    project.allocatedAmount
                                                )
                                            }
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Released
                                        </span>

                                        <strong>
                                            {
                                                formatMoney(
                                                    project.releasedAmount
                                                )
                                            }
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Spent
                                        </span>

                                        <strong>
                                            {
                                                formatMoney(
                                                    project.spentAmount
                                                )
                                            }
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Remaining
                                        </span>

                                        <strong className="remaining">
                                            {
                                                formatMoney(
                                                    getRemaining(
                                                        project
                                                    )
                                                )
                                            }
                                        </strong>

                                    </div>

                                </div>


                                {/* BLOCKCHAIN */}

                                <div className="blockchain-info">

                                    <div>

                                        <span>
                                            Blockchain
                                            Project ID
                                        </span>

                                        <strong>
                                            {
                                                project.blockchainProjectId ||
                                                "Pending"
                                            }
                                        </strong>

                                    </div>


                                    <span
                                        className={
                                            project.blockchainProjectId
                                                ? "blockchain-badge"
                                                : "pending-badge"
                                        }
                                    >
                                        {
                                            project.blockchainProjectId
                                                ? "✓ Verified"
                                                : "Pending"
                                        }
                                    </span>

                                </div>


                                <div className="officer-assignment-row">
                                    <div className="current-officer">
                                        <span>Assigned Officer</span>
                                        <strong>{project.officer || "Not Assigned"}</strong>
                                    </div>

                                    {localStorage.getItem("userRole") === "ADMIN" && (
                                        <button
                                            type="button"
                                            className="assign-officer-button"
                                            onClick={() => openAssignOfficer(project)}
                                        >
                                            {project.officer ? "Change Officer" : "Assign Officer"}
                                        </button>
                                    )}
                                </div>

                                {/* DETAILS BUTTON */}

                                <button
                                    className="view-button"
                                    onClick={() =>
                                        navigate(
                                            `/projects/${project.projectId}`
                                        )
                                    }
                                >
                                    View Project Details →
                                </button>

                            </div>

                        )
                    )}

                </div>

            )}

            {assigningProject && (
                <div className="assignment-modal-overlay" onClick={closeAssignOfficer}>
                    <div className="assignment-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="assignment-modal-header">
                            <div>
                                <span className="project-id">{assigningProject.projectId}</span>
                                <h2>Assign Officer</h2>
                                <p>{assigningProject.name}</p>
                            </div>
                            <button type="button" className="assignment-close" onClick={closeAssignOfficer} disabled={assignmentLoading}>×</button>
                        </div>

                        <div className="assignment-modal-body">
                            <label>Select Officer</label>
                            <select value={selectedOfficer} onChange={(e) => setSelectedOfficer(e.target.value)} disabled={assignmentLoading}>
                                <option value="">Select an officer</option>
                                {officers.map((officer) => (
                                    <option key={officer._id || officer.username} value={officer.username}>
                                        {officer.username}
                                    </option>
                                ))}
                            </select>

                            {officers.length === 0 && (
                                <p className="assignment-warning">No officers were loaded. Check Officer Management and the backend.</p>
                            )}

                            {assignmentError && <div className="assignment-error">⚠ {assignmentError}</div>}
                            {assignmentSuccess && <div className="assignment-success">✓ {assignmentSuccess}</div>}
                        </div>

                        <div className="assignment-modal-actions">
                            <button type="button" className="assignment-cancel-button" onClick={closeAssignOfficer} disabled={assignmentLoading}>Close</button>
                            <button type="button" className="assignment-save-button" onClick={assignOfficer} disabled={assignmentLoading || !selectedOfficer}>
                                {assignmentLoading ? "Assigning..." : "Assign Officer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Projects;