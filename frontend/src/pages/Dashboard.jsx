import { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

function Dashboard() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);

            const response = await API.get("/projects");

            setProjects(response.data);
            setError("");
        } catch (err) {
            console.error(err);

            setError(
                "Unable to connect to the Government Fund API."
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================
    // PROJECT NAVIGATION
    // =========================================
    
    const navigate = useNavigate();
    
    const userRole =
        localStorage.getItem("userRole");

    const username =
        localStorage.getItem("username");

    const isAdmin = userRole === "ADMIN";
    const isOfficer = userRole === "OFFICER";
    const isCitizen = userRole === "CITIZEN";


    // =========================================
    // ROLE-BASED PROJECTS
    // =========================================

    const visibleProjects =
        isOfficer
            ? projects.filter(
                (project) =>
                    String(project.officer || "")
                        .toLowerCase()
                        ===
                    String(username || "")
                        .toLowerCase()
            )
            : projects;


// Projects used for dashboard calculations
const dashboardProjects =
    isOfficer
        ? visibleProjects
        : projects; 
               


    // =========================================
    // FINANCIAL CALCULATIONS
    // =========================================

    const totalAllocated = dashboardProjects.reduce(
        (sum, project) =>
            sum + Number(project.allocatedAmount || 0),
        0
    );

    const totalReleased = dashboardProjects.reduce(
        (sum, project) =>
            sum + Number(project.releasedAmount || 0),
        0
    );

    const totalSpent = dashboardProjects.reduce(
        (sum, project) =>
            sum + Number(project.spentAmount || 0),
        0
    );

    const remainingReleased =
        Math.max(totalReleased - totalSpent, 0);

    const remainingAllocated =
        Math.max(totalAllocated - totalReleased, 0);

    // =========================================
    // PROJECT STATUS
    // =========================================

    const planned = dashboardProjects.filter(
        project => project.status === "PLANNED"
    ).length;

    const inProgress = dashboardProjects.filter(
        project => project.status === "IN_PROGRESS"
    ).length;

    const completed = dashboardProjects.filter(
        project => project.status === "COMPLETED"
    ).length;

    const cancelled = dashboardProjects.filter(
        project => project.status === "CANCELLED"
    ).length;

    // =========================================
    // PERCENTAGES
    // =========================================

    const releasePercentage =
        totalAllocated > 0
            ? Math.min(
                  (totalReleased / totalAllocated) * 100,
                  100
              )
            : 0;

    const spentPercentage =
        totalReleased > 0
            ? Math.min(
                  (totalSpent / totalReleased) * 100,
                  100
              )
            : 0;

    const overallSpentPercentage =
        totalAllocated > 0
            ? Math.min(
                  (totalSpent / totalAllocated) * 100,
                  100
              )
            : 0;
    
    const allocatedRemainingPercentage =
        totalAllocated > 0
            ? Math.max(
                ((totalAllocated - totalReleased) /
                    totalAllocated) *
                    100,
                0
            )
            : 0;

    const releasedRemainingPercentage =
        totalReleased > 0
            ? Math.max(
                ((totalReleased - totalSpent) /
                    totalReleased) *
                    100,
                0
            )
            : 0;

    const statusTotal =
        dashboardProjects.length || 1;

    const plannedPercentage =
        (planned / statusTotal) * 100;

    const inProgressPercentage =
        (inProgress / statusTotal) * 100;

    const completedPercentage =
        (completed / statusTotal) * 100;

    const cancelledPercentage =
        (cancelled / statusTotal) * 100;




    // =========================================
    // MONEY FORMAT
    // =========================================

    const formatMoney = amount =>
        `₹${Number(amount || 0).toLocaleString("en-IN")}`;

    const handleLogout = () => {
            localStorage.removeItem("token");
            localStorage.removeItem("userRole");
            localStorage.removeItem("username");
            localStorage.removeItem("isLoggedIn");

            navigate("/login");
    };
    const openProject = projectId => {
        window.location.href =
             `/projects/${projectId}`;
    };

    // =========================================
    // LOADING
    // =========================================

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loader"></div>

                <p>
                    Loading Government Fund Dashboard...
                </p>
            </div>
        );
    }

    return (
        <div className="dashboard">

            {/* ================================= */}
            {/* HEADER */}
            {/* ================================= */}

            <div className="dashboard-user-area">

                <div className="dashboard-user-info">

                    <span className="dashboard-user-icon">
                        👤
                    </span>

                    <div>
                        <strong>
                            {username || "User"}
                        </strong>

                        <span>
                            {isAdmin
                                ? "ADMINISTRATOR"
                                : isOfficer
                                    ? "PROJECT OFFICER"
                                    : "CITIZEN"}
                        </span>
                    </div>

                </div>


                <button
                    type="button"
                    className="logout-button"
                    onClick={handleLogout}
                >
                    Logout
                </button>

            </div>

            {/* ROLE NAVIGATION */}
            <nav className="role-navigation">
                <button type="button" onClick={() => navigate("/")} className="role-nav-button">Dashboard</button>
                <button type="button" onClick={() => (window.location.href = "/projects")} className="role-nav-button">Projects</button>
                
                {isAdmin && (
                    <>
                    <button type="button" onClick={() => (window.location.href = "/projects/create")} className="role-nav-button">Create Project</button>
                  <button type="button" onClick={() =>navigate("/officers")} className="role-nav-button">Officer Management</button>
                   { /* <button onClick={() => navigate("/officers")}className="action-button primary">+ Add Officer</button>*/}
                    
                    </>
                )}
                {isOfficer && (
                    <button type="button" onClick={() => (window.location.href = "/projects")} className="role-nav-button">Record Expenses</button>
                )}
                <button type="button" onClick={() => (window.location.href = "/projects")} className="role-nav-button">Blockchain History</button>
            </nav>

            <header className="topbar">

                <div className="brand">

                    <div className="brand-icon">
                        ₹
                    </div>

                    <div>
                        <h1>
                            Government Fund
                        </h1>

                        <p>
                            Blockchain Tracking System
                        </p>
                    </div>

                </div>

                <div className="network-status">

                    <span className="status-dot"></span>

                    Blockchain Connected

                </div>

            </header>


            {/* ================================= */}
            {/* HERO */}
            {/* ================================= */}

            <section className="hero">

                <div>

                    <p className="eyebrow">
                        TRANSPARENT • SECURE • TRACEABLE
                    </p>

                    <h2>
                        {isAdmin
                            ? "Government Fund Management"
                            : isOfficer
                                ? "Project Expense Management"
                                : "Government Fund Transparency"}
                    </h2>

                    <p className="hero-description">
                        {isAdmin
                            ? "Manage government projects, allocate funds, release funds and monitor project completion."
                            : isOfficer
                                ? "Record project expenses and monitor government fund utilization."
                                : "View government projects, fund utilization and blockchain-verified transactions."}
                    </p>

                </div>

                <div className="hero-badge">

                    <div className="blockchain-symbol">
                        ⛓
                    </div>

                    <div>
                        <strong>
                            Blockchain Verified
                        </strong>

                        <span>
                            Records are tamper-resistant
                        </span>
                    </div>

                </div>

            </section>


            {/* ================================= */}
            {/* STAT CARDS */}
            {/* ================================= */}

            <section className="stats-grid">

                <div className="stat-card">

                    <div className="stat-icon projects-icon">
                        P
                    </div>

                    <div>
                        <span>
                            Total Projects
                        </span>

                        <strong>
                            {projects.length}
                        </strong>
                    </div>

                </div>


                <div className="stat-card">

                    <div className="stat-icon allocated-icon">
                        ₹
                    </div>

                    <div>
                        <span>
                            Total Allocated
                        </span>

                        <strong>
                            {formatMoney(totalAllocated)}
                        </strong>
                    </div>

                </div>


                <div className="stat-card">

                    <div className="stat-icon released-icon">
                        R
                    </div>

                    <div>
                        <span>
                            Funds Released
                        </span>

                        <strong>
                            {formatMoney(totalReleased)}
                        </strong>
                    </div>

                </div>


                <div className="stat-card">

                    <div className="stat-icon spent-icon">
                        S
                    </div>

                    <div>
                        <span>
                            Total Spent
                        </span>

                        <strong>
                            {formatMoney(totalSpent)}
                        </strong>
                    </div>

                </div>

            </section>


            {/* ================================= */}
            {/* ERROR */}
            {/* ================================= */}

            {error && (
                <div className="error-box">
                    ⚠ {error}
                </div>
            )}


            {/* ================================= */}
            {/* FINANCIAL OVERVIEW */}
            {/* ================================= */}

            <section className="content-grid">

                <div className="panel">

                    <div className="panel-header">

                        <div>

                            <h3>
                                Fund Utilization
                            </h3>

                            <p>
                                Current financial overview
                            </p>

                        </div>

                    </div>


                    {/* ALLOCATED → RELEASED */}

                    <div className="util-row">

                        <div className="util-label">

                            <span>
                                Funds Released
                            </span>

                            <strong>
                                {formatMoney(totalReleased)}
                            </strong>

                        </div>

                        <div className="progress-track">

                            <div
                                className="progress released-progress"
                                style={{
                                    width:
                                        `${releasePercentage}%`
                                }}
                            />

                        </div>

                        <small>
                            {releasePercentage.toFixed(1)}%
                            of allocated funds released
                        </small>

                    </div>


                    {/* RELEASED → SPENT */}

                    <div className="util-row">

                        <div className="util-label">

                            <span>
                                Funds Spent
                            </span>

                            <strong>
                                {formatMoney(totalSpent)}
                            </strong>

                        </div>

                        <div className="progress-track">

                            <div
                                className="progress spent-progress"
                                style={{
                                    width:
                                        `${spentPercentage}%`
                                }}
                            />

                        </div>

                        <small>
                            {spentPercentage.toFixed(1)}%
                            of released funds spent
                        </small>

                    </div>


                    {/* REMAINING */}

                    <div className="fund-summary">

                        <div>
                            <span>
                                Yet to Release
                            </span>

                            <strong>
                                {formatMoney(
                                    remainingAllocated
                                )}
                            </strong>
                        </div>


                        <div>
                            <span>
                                Available for Expenses
                            </span>

                            <strong>
                                {formatMoney(
                                    remainingReleased
                                )}
                            </strong>
                        </div>

                    </div>


                    {/* OVERALL */}

                    <div className="overall-utilization">

                        <div>

                            <span>
                                Overall Fund Utilization
                            </span>

                            <strong>
                                {overallSpentPercentage.toFixed(1)}%
                            </strong>

                        </div>

                        <div className="progress-track large">

                            <div
                                className="progress spent-progress"
                                style={{
                                    width:
                                        `${overallSpentPercentage}%`
                                }}
                            />

                        </div>

                    </div>

                </div>


                {/* ================================= */}
                {/* PROJECT STATUS */}
                {/* ================================= */}

                <div className="panel">

                    <div className="panel-header">

                        <div>

                            <h3>
                                Project Status
                            </h3>

                            <p>
                                Current project distribution
                            </p>

                        </div>

                    </div>


                    <div className="status-list">

                        <div className="status-row">

                            <div>
                                <span className="status-dot-small planned-dot"></span>
                                Planned
                            </div>

                            <strong>
                                {planned}
                            </strong>

                        </div>


                        <div className="status-row">

                            <div>
                                <span className="status-dot-small progress-dot"></span>
                                In Progress
                            </div>

                            <strong>
                                {inProgress}
                            </strong>

                        </div>


                        <div className="status-row">

                            <div>
                                <span className="status-dot-small completed-dot"></span>
                                Completed
                            </div>

                            <strong>
                                {completed}
                            </strong>

                        </div>


                        <div className="status-row">

                            <div>
                                <span className="status-dot-small cancelled-dot"></span>
                                Cancelled
                            </div>

                            <strong>
                                {cancelled}
                            </strong>

                        </div>

                    </div>


                    {/* STATUS BAR */}

                    <div className="status-bar">

                        {visibleProjects.length > 0 && (
                            <>
                                <div
                                    className="status-segment planned-segment"
                                    style={{
                                        width:
                                            `${(planned / statusTotal) * 100}%`
                                    }}
                                />

                                <div
                                    className="status-segment progress-segment"
                                    style={{
                                        width:
                                            `${(inProgress / statusTotal) * 100}%`
                                    }}
                                />

                                <div
                                    className="status-segment completed-segment"
                                    style={{
                                        width:
                                            `${(completed / statusTotal) * 100}%`
                                    }}
                                />

                                <div
                                    className="status-segment cancelled-segment"
                                    style={{
                                        width:
                                            `${(cancelled / statusTotal) * 100}%`
                                    }}
                                />
                            </>
                        )}

                    </div>

                </div>

            </section>


            {/* ================================= */}
            {/* RECENT PROJECTS */}
            {/* ================================= */}

            <section className="projects-panel">

                <div className="panel-header">

                    <div>

                        <h3>
                            Recent Projects
                        </h3>

                        <p>
                            {isCitizen
                                ? "Publicly available government projects and fund information"
                                : isOfficer
                                    ? "Projects assigned for monitoring and expense recording"
                                    : "Government projects managed through the fund tracking system"}
                        </p>

                    </div>

                    <div className="header-actions">

                        <button
                            className="refresh-button"
                            onClick={fetchProjects}
                        >
                            ↻ Refresh
                        </button>

                        <button
                            className="refresh-button"
                            onClick={() =>
                                window.location.href =
                                    "/projects"
                            }
                        >
                            View All Projects →
                        </button>

                    </div>

                </div>


                {visibleProjects.length === 0 ? (

                    <div className="empty-state">

                        <div>
                            📁
                        </div>

                        <h3>
                            No projects found
                        </h3>

                        <p>
                            {isAdmin
                                ? "Create your first government project to see it here."
                                : isOfficer
                                    ? "No government projects are currently available."
                                    : "No government projects are currently available for viewing."}
                        </p>

                    </div>

                ) : (

                    <div className="project-table-wrapper">

                        <table className="project-table">

                            <thead>

                                <tr>

                                    <th>
                                        Project
                                    </th>

                                    <th>
                                        Location
                                    </th>

                                    <th>
                                        Allocated
                                    </th>

                                    <th>
                                        Released
                                    </th>

                                    <th>
                                        Spent
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Blockchain
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {visibleProjects
                                    .slice(0, 10)
                                    .map(project => (

                                        <tr
                                            key={
                                                project.projectId
                                            }
                                            onClick={() =>
                                                openProject(
                                                    project.projectId
                                                )
                                            }
                                            className="project-row-clickable"
                                        >

                                            <td>

                                                <div className="project-name">

                                                    <strong>
                                                        {project.name}
                                                    </strong>

                                                    <span>
                                                        {
                                                            project.projectId
                                                        }
                                                    </span>

                                                </div>

                                            </td>


                                            <td>

                                                <div className="location">

                                                    <span>
                                                        {
                                                            project.village
                                                        }
                                                    </span>

                                                    <small>
                                                        {
                                                            project.district
                                                        }
                                                    </small>

                                                </div>

                                            </td>


                                            <td>
                                                {formatMoney(
                                                    project.allocatedAmount
                                                )}
                                            </td>


                                            <td>
                                                {formatMoney(
                                                    project.releasedAmount
                                                )}
                                            </td>


                                            <td>
                                                {formatMoney(
                                                    project.spentAmount
                                                )}
                                            </td>


                                            <td>

                                                <span
                                                    className={`status-badge ${
                                                        project.status ===
                                                        "COMPLETED"
                                                            ? "completed"
                                                            : project.status ===
                                                              "IN_PROGRESS"
                                                            ? "progress-status"
                                                            : project.status ===
                                                              "CANCELLED"
                                                            ? "cancelled"
                                                            : "planned"
                                                    }`}
                                                >
                                                    {project.status}
                                                </span>

                                            </td>


                                            <td>

                                                {project.blockchainProjectId ? (

                                                    <span className="blockchain-badge">
                                                        ✓ Verified
                                                    </span>

                                                ) : (

                                                    <span className="pending-badge">
                                                        Pending
                                                    </span>

                                                )}

                                            </td>

                                        </tr>

                                    ))}

                            </tbody>

                        </table>

                    </div>

                )}

            </section>

            {/* ================================= */}
{/* ANALYTICS */}
{/* ================================= */}

<section className="analytics-grid">

    {/* FUND BREAKDOWN */}

    <div className="panel analytics-panel">

        <div className="panel-header">

            <div>
                <h3>
                    Fund Breakdown
                </h3>

                <p>
                    Allocation, release and expenditure
                </p>
            </div>

        </div>


        <div className="fund-chart">

            {/* ALLOCATED */}

            <div className="chart-item">

                <div className="chart-label">

                    <span>
                        Allocated
                    </span>

                    <strong>
                        {formatMoney(totalAllocated)}
                    </strong>

                </div>

                <div className="chart-track">

                    <div
                        className="chart-bar allocated-bar"
                        style={{
                            width:
                                totalAllocated > 0
                                    ? "100%"
                                    : "0%"
                        }}
                    />

                </div>

            </div>


            {/* RELEASED */}

            <div className="chart-item">

                <div className="chart-label">

                    <span>
                        Released
                    </span>

                    <strong>
                        {formatMoney(totalReleased)}
                    </strong>

                </div>

                <div className="chart-track">

                    <div
                        className="chart-bar released-bar"
                        style={{
                            width:
                                `${releasePercentage}%`
                        }}
                    />

                </div>

                <small>
                    {releasePercentage.toFixed(1)}%
                    of allocation
                </small>

            </div>


            {/* SPENT */}

            <div className="chart-item">

                <div className="chart-label">

                    <span>
                        Spent
                    </span>

                    <strong>
                        {formatMoney(totalSpent)}
                    </strong>

                </div>

                <div className="chart-track">

                    <div
                        className="chart-bar spent-bar"
                        style={{
                            width:
                                `${overallSpentPercentage}%`
                        }}
                    />

                </div>

                <small>
                    {overallSpentPercentage.toFixed(1)}%
                    of allocation
                </small>

            </div>

        </div>

    </div>


    {/* PROJECT STATUS */}

    <div className="panel analytics-panel">

        <div className="panel-header">

            <div>

                <h3>
                    Project Distribution
                </h3>

                <p>
                    Current project status
                </p>

            </div>

        </div>


        <div className="status-chart-container">

            <div
                className="status-donut"
                style={{
                    background: `conic-gradient(
                        #98a2b3 0 ${plannedPercentage}%,
                        #315d96 ${plannedPercentage}% ${plannedPercentage + inProgressPercentage}%,
                        #3b8c67 ${plannedPercentage + inProgressPercentage}% ${plannedPercentage + inProgressPercentage + completedPercentage}%,
                        #d65c5c ${plannedPercentage + inProgressPercentage + completedPercentage}% 100%
                    )`
                }}
            >

                <div className="donut-center">

                    <strong>
                        {dashboardProjects.length}
                    </strong>

                    <span>
                        Projects
                    </span>

                </div>

            </div>


            <div className="chart-legend">

                <div>
                    <span className="legend-dot planned-dot"></span>
                    <span>Planned</span>
                    <strong>{planned}</strong>
                </div>

                <div>
                    <span className="legend-dot progress-dot"></span>
                    <span>In Progress</span>
                    <strong>{inProgress}</strong>
                </div>

                <div>
                    <span className="legend-dot completed-dot"></span>
                    <span>Completed</span>
                    <strong>{completed}</strong>
                </div>

                <div>
                    <span className="legend-dot cancelled-dot"></span>
                    <span>Cancelled</span>
                    <strong>{cancelled}</strong>
                </div>

            </div>

        </div>

    </div>

</section>
            {/* ================================= */}
            {/* FOOTER */}
            {/* ================================= */}

            <footer className="dashboard-footer">

                <span>
                    Government Fund Allocation &
                    Tracking System
                </span>

                <span>
                    Powered by Blockchain Technology
                </span>

            </footer>

        </div>
    );
}

export default Dashboard;
