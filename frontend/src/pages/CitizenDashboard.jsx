import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/citizen.css";
import API from "../services/api";

function CitizenDashboard() {

    const navigate = useNavigate();

    const [projects, setProjects] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");


    useEffect(() => {

        loadProjects();

    }, []);


    const loadProjects = async () => {

        try {

            setLoading(true);
            setError("");

            const response =
                await API.get("/projects");

            setProjects(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

        } catch (error) {

            console.error(
                "Failed to load projects:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to load projects."
            );

        } finally {

            setLoading(false);

        }
    };


    const handleLogout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        localStorage.removeItem("username");
        localStorage.removeItem("isLoggedIn");

        navigate("/login");
    };


    const filteredProjects =
        projects.filter((project) => {

            const searchText =
                search.toLowerCase().trim();

            if (!searchText) {
                return true;
            }

            return (
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
                    .includes(searchText)
            );

        });


    const formatAmount = (amount) => {

        return new Intl.NumberFormat(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0
            }
        ).format(
            Number(amount || 0)
        );
    };


    return (

        <div className="citizen-page">

            {/* ======================================
                HEADER
            ====================================== */}

            <header className="citizen-header">

                <div>

                    <div className="citizen-brand">
                        ⛓ Government Fund Portal
                    </div>

                    <div className="citizen-header-subtitle">
                        Public Transparency Dashboard
                    </div>

                </div>


                <div className="citizen-user-area">

                    <div className="citizen-user">

                        <span className="citizen-user-icon">
                            👤
                        </span>

                        <div>

                            <strong>
                                {localStorage.getItem(
                                    "username"
                                ) || "Citizen"}
                            </strong>

                            <span>
                                CITIZEN
                            </span>

                        </div>

                    </div>


                    <button
                        className="citizen-logout"
                        onClick={
                            handleLogout
                        }
                    >
                        Logout
                    </button>

                </div>

            </header>


            {/* ======================================
                HERO
            ====================================== */}

            <section className="citizen-hero">

                <div>

                    <span className="citizen-hero-label">
                        PUBLIC TRANSPARENCY
                    </span>

                    <h1>
                        Government Projects
                    </h1>

                    <p>
                        Track how government funds
                        are allocated, released and
                        spent on development projects.
                    </p>

                </div>


                <div className="citizen-hero-icon">
                    🔗
                </div>

            </section>


            {/* ======================================
                STATISTICS
            ====================================== */}

            <section className="citizen-stats">

                <div className="citizen-stat-card">

                    <span>
                        Total Projects
                    </span>

                    <strong>
                        {projects.length}
                    </strong>

                </div>


                <div className="citizen-stat-card">

                    <span>
                        Total Allocated
                    </span>

                    <strong>
                        {formatAmount(
                            projects.reduce(
                                (
                                    total,
                                    project
                                ) =>
                                    total +
                                    Number(
                                        project.allocatedAmount ||
                                        0
                                    ),
                                0
                            )
                        )}
                    </strong>

                </div>


                <div className="citizen-stat-card">

                    <span>
                        Total Released
                    </span>

                    <strong>
                        {formatAmount(
                            projects.reduce(
                                (
                                    total,
                                    project
                                ) =>
                                    total +
                                    Number(
                                        project.releasedAmount ||
                                        0
                                    ),
                                0
                            )
                        )}
                    </strong>

                </div>


                <div className="citizen-stat-card">

                    <span>
                        Total Spent
                    </span>

                    <strong>
                        {formatAmount(
                            projects.reduce(
                                (
                                    total,
                                    project
                                ) =>
                                    total +
                                    Number(
                                        project.spentAmount ||
                                        0
                                    ),
                                0
                            )
                        )}
                    </strong>

                </div>

            </section>


            {/* ======================================
                SEARCH
            ====================================== */}

            <section className="citizen-project-section">

                <div className="citizen-section-heading">

                    <div>

                        <h2>
                            Development Projects
                        </h2>

                        <p>
                            Select a project to view
                            its complete fund history.
                        </p>

                    </div>

                </div>


                <div className="citizen-search">

                    🔍

                    <input
                        type="text"
                        placeholder="Search by project ID, name, village or district..."
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                    />

                </div>


                {/* ==================================
                    LOADING
                ================================== */}

                {loading && (

                    <div className="citizen-message">
                        Loading projects...
                    </div>

                )}


                {/* ==================================
                    ERROR
                ================================== */}

                {!loading && error && (

                    <div className="citizen-error">
                        ⚠ {error}
                    </div>

                )}


                {/* ==================================
                    NO PROJECTS
                ================================== */}

                {!loading &&
                    !error &&
                    filteredProjects.length === 0 && (

                        <div className="citizen-message">

                            No projects found.

                        </div>

                    )}


                {/* ==================================
                    PROJECT CARDS
                ================================== */}

                {!loading &&
                    !error &&
                    filteredProjects.length > 0 && (

                        <div className="citizen-project-grid">

                            {filteredProjects.map(
                                (project) => {

                                    const allocated =
                                        Number(
                                            project.allocatedAmount ||
                                            0
                                        );

                                    const released =
                                        Number(
                                            project.releasedAmount ||
                                            0
                                        );

                                    const spent =
                                        Number(
                                            project.spentAmount ||
                                            0
                                        );

                                    const remaining =
                                        Math.max(
                                            released -
                                            spent,
                                            0
                                        );


                                    return (

                                        <div
                                            className="citizen-project-card"
                                            key={
                                                project.projectId
                                            }
                                        >

                                            <div className="citizen-project-top">

                                                <div>

                                                    <span className="citizen-project-id">
                                                        {project.projectId}
                                                    </span>

                                                    <h3>
                                                        {project.name}
                                                    </h3>

                                                </div>


                                                <span
                                                    className={`citizen-status citizen-status-${String(
                                                        project.status ||
                                                        "PLANNED"
                                                    ).toLowerCase()}`}
                                                >
                                                    {project.status ||
                                                        "PLANNED"}
                                                </span>

                                            </div>


                                            <div className="citizen-location">

                                                📍{" "}

                                                {project.village ||
                                                    "—"}

                                                {project.district
                                                    ? `, ${project.district}`
                                                    : ""}

                                            </div>


                                            {/* FUND SUMMARY */}

                                            <div className="citizen-fund-grid">

                                                <div>

                                                    <span>
                                                        Allocated
                                                    </span>

                                                    <strong>
                                                        {formatAmount(
                                                            allocated
                                                        )}
                                                    </strong>

                                                </div>


                                                <div>

                                                    <span>
                                                        Released
                                                    </span>

                                                    <strong>
                                                        {formatAmount(
                                                            released
                                                        )}
                                                    </strong>

                                                </div>


                                                <div>

                                                    <span>
                                                        Spent
                                                    </span>

                                                    <strong>
                                                        {formatAmount(
                                                            spent
                                                        )}
                                                    </strong>

                                                </div>


                                                <div>

                                                    <span>
                                                        Available
                                                    </span>

                                                    <strong>
                                                        {formatAmount(
                                                            remaining
                                                        )}
                                                    </strong>

                                                </div>

                                            </div>


                                            {/* PROGRESS */}

                                            <div className="citizen-progress">

                                                <div className="citizen-progress-label">

                                                    <span>
                                                        Fund utilization
                                                    </span>

                                                    <span>
                                                        {released > 0
                                                            ? Math.min(
                                                                Math.round(
                                                                    (
                                                                        spent /
                                                                        released
                                                                    ) *
                                                                    100
                                                                ),
                                                                100
                                                            )
                                                            : 0}
                                                        %
                                                    </span>

                                                </div>


                                                <div className="citizen-progress-track">

                                                    <div
                                                        className="citizen-progress-fill"
                                                        style={{
                                                            width:
                                                                `${
                                                                    released > 0
                                                                        ? Math.min(
                                                                            (
                                                                                spent /
                                                                                released
                                                                            ) *
                                                                            100,
                                                                            100
                                                                        )
                                                                        : 0
                                                                }%`
                                                        }}
                                                    />

                                                </div>

                                            </div>


                                            {/* ACTION */}

                                            <button
                                                className="citizen-view-button"
                                                onClick={() =>
                                                    navigate(
                                                        `/projects/${project.projectId}`
                                                    )
                                                }
                                            >
                                                View Project & Blockchain History
                                                <span>
                                                    →
                                                </span>
                                            </button>

                                        </div>

                                    );

                                }
                            )}

                        </div>

                    )}

            </section>


            {/* ======================================
                FOOTER
            ====================================== */}

            <footer className="citizen-footer">

                <span>
                    🔗 Blockchain-secured
                    transparency
                </span>

                <span>
                    Government Fund
                    Allocation & Tracking System
                </span>

            </footer>

        </div>
    );
}

export default CitizenDashboard;