import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import API from "../services/api";

const CONTRACT_ADDRESS =
    import.meta.env.VITE_CONTRACT_ADDRESS ||
    "0x5FbDB2315678afecb367f032d93F642f64180aa3";

function ProjectDetails() {
    const { projectId } = useParams();
    const navigate = useNavigate();

    const role = (localStorage.getItem("userRole") || "CITIZEN")
        .trim()
        .toUpperCase();
    const isAdmin = role === "ADMIN";
    const isOfficer = role === "OFFICER";
    const isCitizen = role === "CITIZEN";

    const [project, setProject] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [expenses, setExpenses] = useState([]);

    const [loading, setLoading] = useState(true);
    const [transactionsLoading, setTransactionsLoading] = useState(true);
    const [expensesLoading, setExpensesLoading] = useState(true);
    const [error, setError] = useState("");

    const [showAllocationForm, setShowAllocationForm] = useState(false);
    const [showReleaseForm, setShowReleaseForm] = useState(false);
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [showExpenseHistory, setShowExpenseHistory] = useState(false);
    const [expandedExpense, setExpandedExpense] = useState(null);

    const [allocationAmount, setAllocationAmount] = useState("");
    const [allocationLoading, setAllocationLoading] = useState(false);

    const [releaseAmount, setReleaseAmount] = useState("");
    const [releaseLoading, setReleaseLoading] = useState(false);

    const [expenseAmount, setExpenseAmount] = useState("");
    const [expenseCategory, setExpenseCategory] = useState("");
    const [expenseDescription, setExpenseDescription] = useState("");
    const [expensePaidTo, setExpensePaidTo] = useState("");
    const [expenseEvidence, setExpenseEvidence] = useState([]);
    const [expenseLoading, setExpenseLoading] = useState(false);
    const [expenseError, setExpenseError] = useState("");
    const [expenseSuccess, setExpenseSuccess] = useState("");

    const [actionMessage, setActionMessage] = useState("");
    const [actionError, setActionError] = useState("");
    const [completeLoading, setCompleteLoading] = useState(false);

    const formatMoney = (value) =>
        `₹${Number(value || 0).toLocaleString("en-IN")}`;

    const formatTimestamp = (value) => {
        if (!value) return "Unknown date";
        const n = Number(value);
        const date = new Date(n < 10000000000 ? n * 1000 : n);
        return Number.isNaN(date.getTime())
            ? "Unknown date"
            : date.toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
              });
    };

    const loadProject = async () => {
        try {
            setLoading(true);
            const response = await API.get(`/projects/${projectId}`);
            setProject(response.data);
            setError("");
        } catch (err) {
            console.error("PROJECT LOAD ERROR:", err);
            setError(
                err.response?.data?.error ||
                    err.response?.data?.message ||
                    "Unable to load project details."
            );
        } finally {
            setLoading(false);
        }
    };

    const loadTransactions = async () => {
        try {
            setTransactionsLoading(true);
            const response = await API.get(
                `/projects/${projectId}/transactions`
            );
            setTransactions(
                Array.isArray(response.data)
                    ? response.data
                    : response.data?.transactions || []
            );
        } catch (err) {
            console.error("TRANSACTION LOAD ERROR:", err);
            setTransactions([]);
        } finally {
            setTransactionsLoading(false);
        }
    };

    const loadExpenses = async () => {
        try {
            setExpensesLoading(true);
            const response = await API.get(`/projects/${projectId}/expenses`);
            setExpenses(
                Array.isArray(response.data)
                    ? response.data
                    : response.data?.expenses || []
            );
        } catch (err) {
            console.error("EXPENSE HISTORY LOAD ERROR:", err);
            setExpenses([]);
        } finally {
            setExpensesLoading(false);
        }
    };

useEffect(() => {

    loadProject();
    loadTransactions();

    // Expense history is private.
    // Only Admin and Officer can load it.

    if (isAdmin || isOfficer) {
        loadExpenses();
    }

}, [projectId, isAdmin, isOfficer]);   

    const copyToClipboard = async (value, message) => {
        try {
            await navigator.clipboard.writeText(value);
            setActionMessage(message);
            setActionError("");
        } catch (err) {
            console.error("COPY ERROR:", err);
            setActionError("Unable to copy to clipboard.");
        }
    };

    const closeForms = () => {
        setShowAllocationForm(false);
        setShowReleaseForm(false);
        setShowExpenseForm(false);
    };

    const handleAllocateFunds = async (e) => {
        e.preventDefault();
        const amount = Number(allocationAmount);
        if (!Number.isFinite(amount) || amount <= 0) {
            setActionError("Please enter a valid allocation amount.");
            return;
        }
        try {
            setAllocationLoading(true);
            setActionError("");
            setActionMessage("");
            const response = await API.post(`/projects/${projectId}/allocate`, {
                amount,
            });
            setActionMessage(
                response.data?.message || "Funds allocated successfully."
            );
            setAllocationAmount("");
            setShowAllocationForm(false);
            await loadProject();
            await loadTransactions();
        } catch (err) {
            console.error("ALLOCATION ERROR:", err);
            setActionError(
                err.response?.data?.error ||
                    err.response?.data?.message ||
                    err.message ||
                    "Failed to allocate funds."
            );
        } finally {
            setAllocationLoading(false);
        }
    };

    const handleReleaseFunds = async (e) => {
        e.preventDefault();
        const amount = Number(releaseAmount);
        const allocated = Number(project?.allocatedAmount || 0);
        const released = Number(project?.releasedAmount || 0);
        const available = Math.max(allocated - released, 0);

        if (!Number.isFinite(amount) || amount <= 0) {
            setActionError("Please enter a valid release amount.");
            return;
        }
        if (amount > available) {
            setActionError(
                `You can release a maximum of ${formatMoney(available)}.`
            );
            return;
        }

        try {
            setReleaseLoading(true);
            setActionError("");
            setActionMessage("");
            const response = await API.post(`/projects/${projectId}/release`, {
                amount,
            });
            setActionMessage(
                response.data?.message || "Funds released successfully."
            );
            setReleaseAmount("");
            setShowReleaseForm(false);
            await loadProject();
            await loadTransactions();
        } catch (err) {
            console.error("RELEASE ERROR:", err);
            setActionError(
                err.response?.data?.error ||
                    err.response?.data?.message ||
                    err.message ||
                    "Failed to release funds."
            );
        } finally {
            setReleaseLoading(false);
        }
    };

    const handleEvidenceChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        if (expenseEvidence.length + files.length > 5) {
            setExpenseError("Maximum 5 photos can be uploaded.");
            e.target.value = "";
            return;
        }

        const invalid = files.find(
            (file) => !["image/jpeg", "image/png", "image/jpg"].includes(file.type)
        );
        if (invalid) {
            setExpenseError("Only JPG, JPEG and PNG images are allowed.");
            e.target.value = "";
            return;
        }

        const tooLarge = files.find((file) => file.size > 5 * 1024 * 1024);
        if (tooLarge) {
            setExpenseError("Each photo must be smaller than 5 MB.");
            e.target.value = "";
            return;
        }

        setExpenseError("");
        setExpenseEvidence((previous) => [...previous, ...files]);
        e.target.value = "";
    };

    const removeEvidenceFile = (index) => {
        setExpenseEvidence((previous) =>
            previous.filter((_, i) => i !== index)
        );
    };

    const resetExpenseForm = () => {
        setExpenseAmount("");
        setExpenseCategory("");
        setExpenseDescription("");
        setExpensePaidTo("");
        setExpenseEvidence([]);
        setExpenseError("");
        setExpenseSuccess("");
    };

    const handleRecordExpense = async (e) => {
        e.preventDefault();
        setExpenseError("");
        setExpenseSuccess("");

        const amount = Number(expenseAmount);
        const released = Number(project?.releasedAmount || 0);
        const spent = Number(project?.spentAmount || 0);
        const available = Math.max(released - spent, 0);

        if (!Number.isFinite(amount) || amount <= 0) {
            setExpenseError("Please enter a valid expense amount.");
            return;
        }
        if (!expenseCategory.trim()) {
            setExpenseError("Please select an expense category.");
            return;
        }
        if (!expenseDescription.trim()) {
            setExpenseError("Please enter an expense description.");
            return;
        }
        if (amount > available) {
            setExpenseError(
                `Available expense balance is ${formatMoney(available)}.`
            );
            return;
        }

        try {
            setExpenseLoading(true);

            const formData = new FormData();
            formData.append("amount", String(amount));
            formData.append("category", expenseCategory.trim());
            formData.append("description", expenseDescription.trim());
            formData.append("paidTo", expensePaidTo.trim());

            // IMPORTANT: append every selected photo with the same field name.
            expenseEvidence.forEach((file) => {
                formData.append("evidence", file);
            });

            const response = await API.post(
                `/projects/${projectId}/expense`,
                formData
            );

            setExpenseSuccess(
                response.data?.message || "Expense recorded successfully!"
            );
            resetExpenseForm();
            await loadProject();
            await loadTransactions();
            await loadExpenses();
        } catch (err) {
            console.error("EXPENSE ERROR:", err);
            setExpenseError(
                err.response?.data?.error ||
                    err.response?.data?.message ||
                    err.message ||
                    "Failed to record expense."
            );
        } finally {
            setExpenseLoading(false);
        }
    };

    const handleCompleteProject = async () => {
        if (
            !project ||
            project.status === "COMPLETED" ||
            project.status === "CANCELLED"
        ) {
            return;
        }

        if (!window.confirm("Are you sure you want to mark this project as completed?")) {
            return;
        }

        try {
            setCompleteLoading(true);
            setActionError("");
            setActionMessage("");
            const response = await API.post(`/projects/${projectId}/complete`);
            setActionMessage(
                response.data?.message || "Project completed successfully."
            );
            await loadProject();
            await loadTransactions();
        } catch (err) {
            console.error("COMPLETE PROJECT ERROR:", err);
            setActionError(
                err.response?.data?.error ||
                    err.response?.data?.message ||
                    err.message ||
                    "Failed to complete project."
            );
        } finally {
            setCompleteLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loader" />
                <p>Loading project details...</p>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="details-error">
                <h2>Project not found</h2>
                <p>{error || "The requested project does not exist."}</p>
                <button type="button" onClick={() => navigate("/projects")}>
                    ← Back to Projects
                </button>
            </div>
        );
    }

    const allocated = Number(project.allocatedAmount || 0);
    const released = Number(project.releasedAmount || 0);
    const spent = Number(project.spentAmount || 0);
    const remaining = Math.max(released - spent, 0);
    const availableToRelease = Math.max(allocated - released, 0);

    const allocationPercentage = allocated
        ? Math.min((released / allocated) * 100, 100)
        : 0;
    const spendingPercentage = released
        ? Math.min((spent / released) * 100, 100)
        : 0;

    const blockchainConfirmed = project.blockchainStatus === "CONFIRMED";
    const blockchainTransactionHash = project.blockchainTransactionHash;
    const verificationUrl = `${window.location.origin}/projects/${projectId}`;

    return (
        <div className="details-page">
            <header className="details-header">
                <button
                    type="button"
                    className="back-button"
                    onClick={() => navigate("/projects")}
                >
                    ← Back to Projects
                </button>

                <div className="details-title">
                    <div>
                        <span className="project-id">{project.projectId}</span>
                        <h1>{project.name}</h1>
                        <p>
                            {project.village || ""}
                            {project.village && project.district ? ", " : ""}
                            {project.district || ""}
                        </p>
                    </div>
                    <span
                        className={`status-badge ${
                            project.status === "COMPLETED"
                                ? "completed"
                                : project.status === "IN_PROGRESS"
                                ? "progress-status"
                                : project.status === "CANCELLED"
                                ? "cancelled"
                                : "planned"
                        }`}
                    >
                        {project.status}
                    </span>
                </div>
            </header>

            <div className="user-role-badge">
                <span>Current Role</span>
                <strong>
                    {isAdmin
                        ? "Administrator"
                        : isOfficer
                        ? "Project Officer"
                        : isCitizen
                        ? "Citizen"
                        : "Unknown"}
                </strong>
            </div>

            {isCitizen && (
                <div className="citizen-transparency-notice">
                    <div className="citizen-transparency-icon">⛓</div>
                    <div>
                        <strong>Public Transparency View</strong>
                        <p>
                            This project is displayed in read-only mode. Citizens
                            can verify fund allocation, releases, expenditure and
                            blockchain transactions.
                        </p>
                    </div>
                </div>
            )}

            {actionMessage && <div className="form-success">✓ {actionMessage}</div>}
            {actionError && <div className="form-error">⚠ {actionError}</div>}

            <section className="details-stats">
                <div className="details-stat">
                    <span>Allocated Funds</span>
                    <strong>{formatMoney(allocated)}</strong>
                </div>
                <div className="details-stat">
                    <span>Released Funds</span>
                    <strong>{formatMoney(released)}</strong>
                </div>
                <div className="details-stat">
                    <span>Total Spent</span>
                    <strong>{formatMoney(spent)}</strong>
                </div>
                <div className="details-stat">
                    <span>Remaining</span>
                    <strong className="remaining">{formatMoney(remaining)}</strong>
                </div>
            </section>

            <section className="details-grid">
                <div className="details-panel">
                    <div className="panel-header">
                        <div>
                            <h3>{isCitizen ? "Public Project Information" : "Project Information"}</h3>
                            <p>Basic project details</p>
                        </div>
                    </div>
                    <div className="info-list">
                        <div><span>Project ID</span><strong>{project.projectId}</strong></div>
                        <div><span>Project Name</span><strong>{project.name}</strong></div>
                        <div><span>Village</span><strong>{project.village || "—"}</strong></div>
                        <div><span>District</span><strong>{project.district || "—"}</strong></div>
                        <div><span>Assigned Officer</span><strong>{project.officer || "—"}</strong></div>
                        <div><span>Description</span><strong>{project.description || "No description"}</strong></div>
                    </div>
                </div>

                <div className="details-panel">
                    <div className="panel-header">
                        <div>
                            <h3>Fund Utilization</h3>
                            <p>Released funds vs expenditure</p>
                        </div>
                    </div>
                    <div className="utilization-large">
                        <div className="utilization-number">
                            <strong>{Math.round(spendingPercentage)}%</strong>
                            <span>of released funds spent</span>
                        </div>
                        <div className="progress-track">
                            <div
                                className="progress spent-progress"
                                style={{ width: `${spendingPercentage}%` }}
                            />
                        </div>
                        <div className="utilization-labels">
                            <span>Spent {formatMoney(spent)}</span>
                            <span>Released {formatMoney(released)}</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="fund-flow-panel">
                <div className="panel-header">
                    <div>
                        <h3>Fund Flow</h3>
                        <p>Track how allocated funds move through the project lifecycle.</p>
                    </div>
                    <span className="fund-flow-status">Live</span>
                </div>
                <div className="fund-flow">
                    <div className="fund-flow-step">
                        <div className="fund-flow-icon allocated">₹</div>
                        <div className="fund-flow-content">
                            <span>Allocated</span>
                            <strong>{formatMoney(allocated)}</strong>
                        </div>
                    </div>
                    <div className="fund-flow-arrow">→</div>
                    <div className="fund-flow-step">
                        <div className="fund-flow-icon released">R</div>
                        <div className="fund-flow-content">
                            <span>Released</span>
                            <strong>{formatMoney(released)}</strong>
                        </div>
                    </div>
                    <div className="fund-flow-arrow">→</div>
                    <div className="fund-flow-step">
                        <div className="fund-flow-icon spent">S</div>
                        <div className="fund-flow-content">
                            <span>Spent</span>
                            <strong>{formatMoney(spent)}</strong>
                        </div>
                    </div>
                    <div className="fund-flow-arrow">→</div>
                    <div className="fund-flow-step">
                        <div className="fund-flow-icon remaining">✓</div>
                        <div className="fund-flow-content">
                            <span>Available</span>
                            <strong>{formatMoney(remaining)}</strong>
                        </div>
                    </div>
                </div>
                <div className="fund-flow-progress">
                    <div className="fund-flow-progress-header">
                        <span>Allocation Progress</span>
                        <strong>{allocationPercentage.toFixed(1)}%</strong>
                    </div>
                    <div className="progress-track">
                        <div
                            className="progress released-progress"
                            style={{ width: `${allocationPercentage}%` }}
                        />
                    </div>
                </div>
            </section>

            <section className="blockchain-panel">
                <div className="blockchain-header">
                    <div>
                        <h3>⛓ Blockchain Verification</h3>
                        <p>Financial records are stored and verified on the blockchain.</p>
                    </div>
                    <span className={`blockchain-badge ${blockchainConfirmed ? "verified" : "pending"}`}>
                        {blockchainConfirmed ? "✓ Verified" : "⏳ Pending"}
                    </span>
                </div>

                <div className="blockchain-data">
                    <div>
                        <span>Blockchain Project ID</span>
                        <strong>{project.blockchainProjectId || "Not assigned"}</strong>
                    </div>
                    <div>
                        <span>Blockchain Status</span>
                        <strong>{project.blockchainStatus || "PENDING"}</strong>
                    </div>
                    <div>
                        <span>Contract Address</span>
                        <div className="blockchain-address-row">
                            <strong className="address">{CONTRACT_ADDRESS}</strong>
                            <button
                                type="button"
                                className="copy-button"
                                onClick={() => copyToClipboard(CONTRACT_ADDRESS, "Contract address copied.")}
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                    <div>
                        <span>Blockchain Transaction</span>
                        <div className="blockchain-address-row">
                            <strong className="address">
                                {blockchainTransactionHash
                                    ? `${blockchainTransactionHash.slice(0, 12)}...${blockchainTransactionHash.slice(-10)}`
                                    : "Not available"}
                            </strong>
                            {blockchainTransactionHash && (
                                <button
                                    type="button"
                                    className="copy-button"
                                    onClick={() => copyToClipboard(blockchainTransactionHash, "Transaction hash copied.")}
                                >
                                    Copy
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="qr-verification">
                    <div>
                        <h4>Project Verification QR</h4>
                        <p>Scan this QR code to open the public project page.</p>
                    </div>
                    <QRCodeSVG value={verificationUrl} size={150} level="H" />
                </div>
            </section>

            {/* =====================================================
                EXPENSE HISTORY
            ===================================================== */}
            {(isAdmin || isOfficer) && (
            <section className="transaction-panel" id="expenses">
                <div className="panel-header">
                    <div>
                        <h3>Expense History</h3>
                        <p>Recorded project expenses and supporting evidence.</p>
                    </div>
                    {!expensesLoading && (
                        <span className="transaction-count">
                            {expenses.length} {expenses.length === 1 ? "Expense" : "Expenses"}
                        </span>
                    )}
                </div>

                <button
                    type="button"
                    className="action-button"
                    onClick={() => setShowExpenseHistory((value) => !value)}
                >
                    {showExpenseHistory ? "Hide Expense History ▲" : "View Expense History ▼"}
                </button>

                {showExpenseHistory && (
                    <div className="transaction-list" style={{ marginTop: 16 }}>
                        {expensesLoading ? (
                            <div className="transaction-loading">Loading expense history...</div>
                        ) : expenses.length === 0 ? (
                            <div className="transaction-empty">
                                <p>No expenses have been recorded yet.</p>
                            </div>
                        ) : (
                            expenses.map((expense, index) => {
                                const open = expandedExpense === expense._id;
                                const evidence = Array.isArray(expense.evidence) ? expense.evidence : [];
                                return (
                                    <div className="transaction-item" key={expense._id || index} style={{ display: "block" }}>
                                        <button
                                            type="button"
                                            onClick={() => setExpandedExpense(open ? null : expense._id)}
                                            style={{
                                                width: "100%",
                                                border: "none",
                                                background: "transparent",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 14,
                                                cursor: "pointer",
                                                textAlign: "left",
                                            }}
                                        >
                                            <div className="transaction-icon">{index + 1}</div>
                                            <div className="transaction-main">
                                                <div className="transaction-top">
                                                    <strong>{expense.category || "Expense"}</strong>
                                                    <span>
                                                        {expense.createdAt
                                                            ? new Date(expense.createdAt).toLocaleString("en-IN")
                                                            : "Unknown date"}
                                                    </span>
                                                </div>
                                                <div className="transaction-bottom">
                                                    <span>{expense.description || "No description"}</span>
                                                </div>
                                            </div>
                                            <div className="transaction-amount">{formatMoney(expense.amount)}</div>
                                            <span>{open ? "▲" : "▼"}</span>
                                        </button>

                                        {open && (
                                            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #e2e8f0" }}>
                                                <div className="info-list">
                                                    <div><span>Description</span><strong>{expense.description || "—"}</strong></div>
                                                    <div><span>Paid To</span><strong>{expense.paidTo || "—"}</strong></div>
                                                    <div><span>Recorded By</span><strong>{expense.recordedBy || "—"}</strong></div>
                                                    <div><span>Amount</span><strong>{formatMoney(expense.amount)}</strong></div>
                                                </div>

                                                <div style={{ marginTop: 18 }}>
                                                    <h4>Proof / Evidence ({evidence.length})</h4>
                                                    {evidence.length ? (
                                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
                                                            {evidence.map((image, imageIndex) => (
                                                                <a
                                                                    key={image.publicId || imageIndex}
                                                                    href={image.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                >
                                                                    <img
                                                                        src={image.url}
                                                                        alt={`Expense evidence ${imageIndex + 1}`}
                                                                        style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 8 }}
                                                                    />
                                                                </a>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p>No evidence photos uploaded.</p>
                                                    )}
                                                </div>

                                                {expense.blockchainTransactionHash && (
                                                    <div style={{ marginTop: 16 }}>
                                                        <strong>✓ Blockchain Recorded</strong>
                                                        <p style={{ wordBreak: "break-all" }}>
                                                            {expense.blockchainTransactionHash}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </section>
            )}

            {/* =====================================================
                BLOCKCHAIN TRANSACTION HISTORY
            ===================================================== */}
            <section className="transaction-panel" id="transactions">
                <div className="panel-header">
                    <div>
                        <h3>Blockchain Transaction History</h3>
                        <p>Immutable financial activity recorded on the blockchain.</p>
                    </div>
                    {!transactionsLoading && (
                        <span className="transaction-count">{transactions.length} Transactions</span>
                    )}
                </div>

                {transactionsLoading ? (
                    <div className="transaction-loading">Loading blockchain transactions...</div>
                ) : transactions.length === 0 ? (
                    <div className="transaction-empty">
                        <div>⛓</div>
                        <p>No blockchain transactions found.</p>
                    </div>
                ) : (
                    <div className="transaction-list">
                        {transactions.map((transaction, index) => (
                            <div className="transaction-item" key={transaction.index ?? transaction.id ?? index}>
                                <div className="transaction-icon">✓</div>
                                <div className="transaction-main">
                                    <div className="transaction-top">
                                        <strong>{transaction.transactionType || transaction.type || "TRANSACTION"}</strong>
                                        <span>{formatTimestamp(transaction.timestamp)}</span>
                                    </div>
                                    <div className="transaction-bottom">
                                        <span>Performed by:</span>
                                        <code>{transaction.performedBy || transaction.from || "Unknown"}</code>
                                    </div>
                                </div>
                                <div className="transaction-amount">{formatMoney(transaction.amount)}</div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* =====================================================
                ACTION BUTTONS + FORMS
            ===================================================== */}
            <section className="details-actions">
                <div className="action-buttons-row">
                    {isAdmin && (
                        <button
                            type="button"
                            className="action-button primary"
                            disabled={project.status === "COMPLETED" || project.status === "CANCELLED"}
                            onClick={() => {
                                closeForms();
                                setShowAllocationForm(true);
                                setActionError("");
                            }}
                        >
                            Allocate Funds
                        </button>
                    )}

                    {isAdmin && (
                        <button
                            type="button"
                            className="action-button primary"
                            disabled={project.status === "COMPLETED" || project.status === "CANCELLED" || availableToRelease <= 0}
                            onClick={() => {
                                closeForms();
                                setShowReleaseForm(true);
                                setActionError("");
                            }}
                        >
                            Release Funds
                        </button>
                    )}

                    {isOfficer && (
                        <button
                            type="button"
                            className="action-button"
                            disabled={project.status === "COMPLETED" || project.status === "CANCELLED" || remaining <= 0}
                            onClick={() => {
                                closeForms();
                                setShowExpenseForm(true);
                                setExpenseError("");
                                setExpenseSuccess("");
                            }}
                        >
                            Record Expense
                        </button>
                    )}

                    {isAdmin && (
                        <button
                            type="button"
                            className="action-button complete-button"
                            disabled={project.status === "COMPLETED" || project.status === "CANCELLED" || completeLoading}
                            onClick={handleCompleteProject}
                        >
                            {completeLoading ? "Completing..." : project.status === "COMPLETED" ? "✓ Project Completed" : "Complete Project"}
                        </button>
                    )}

                    <button
                        type="button"
                        className="action-button"
                        onClick={() => document.getElementById("transactions")?.scrollIntoView({ behavior: "smooth" })}
                    >
                        {isCitizen ? "View Verified Blockchain History" : "View Blockchain Transactions"}
                    </button>
                </div>

                {showAllocationForm && isAdmin && (
                    <section className="action-form-panel">
                        <div className="panel-header">
                            <div>
                                <h3>Allocate Government Funds</h3>
                                <p>Allocate funds to this project on the blockchain.</p>
                            </div>
                        </div>
                        <form className="release-form" onSubmit={handleAllocateFunds}>
                            <div className="form-field">
                                <label>Allocation Amount *</label>
                                <div className="amount-input">
                                    <span>₹</span>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        placeholder="Enter allocation amount"
                                        value={allocationAmount}
                                        onChange={(e) => setAllocationAmount(e.target.value)}
                                    />
                                </div>
                            </div>
                            {actionError && <div className="form-error">⚠ {actionError}</div>}
                            <div className="form-actions">
                                <button type="button" className="cancel-button" onClick={() => setShowAllocationForm(false)}>Cancel</button>
                                <button type="submit" className="action-button primary" disabled={allocationLoading}>
                                    {allocationLoading ? "Allocating..." : "Confirm Allocation"}
                                </button>
                            </div>
                        </form>
                    </section>
                )}

                {showReleaseForm && isAdmin && (
                    <section className="action-form-panel">
                        <div className="panel-header">
                            <div>
                                <h3>Release Government Funds</h3>
                                <p>Release a portion of the allocated project funds.</p>
                            </div>
                        </div>
                        <div className="release-info">
                            <div><span>Allocated</span><strong>{formatMoney(allocated)}</strong></div>
                            <div><span>Already Released</span><strong>{formatMoney(released)}</strong></div>
                            <div><span>Available to Release</span><strong className="remaining">{formatMoney(availableToRelease)}</strong></div>
                        </div>
                        <form className="release-form" onSubmit={handleReleaseFunds}>
                            <div className="form-field">
                                <label>Release Amount *</label>
                                <div className="amount-input">
                                    <span>₹</span>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        max={availableToRelease}
                                        placeholder="Enter amount"
                                        value={releaseAmount}
                                        onChange={(e) => setReleaseAmount(e.target.value)}
                                    />
                                </div>
                            </div>
                            {actionError && <div className="form-error">⚠ {actionError}</div>}
                            <div className="form-actions">
                                <button type="button" className="cancel-button" onClick={() => setShowReleaseForm(false)}>Cancel</button>
                                <button type="submit" className="action-button primary" disabled={releaseLoading || availableToRelease <= 0}>
                                    {releaseLoading ? "Processing..." : "Confirm Release"}
                                </button>
                            </div>
                        </form>
                    </section>
                )}

                {showExpenseForm && isOfficer && (
                    <section className="action-form-panel">
                        <div className="panel-header">
                            <div>
                                <h3>Record Project Expense</h3>
                                <p>Record expenditure against released project funds.</p>
                            </div>
                        </div>

                        <div className="expense-available">
                            <div><span>Released</span><strong>{formatMoney(released)}</strong></div>
                            <div><span>Already Spent</span><strong>{formatMoney(spent)}</strong></div>
                            <div><span>Available</span><strong className="remaining">{formatMoney(remaining)}</strong></div>
                        </div>

                        <form className="expense-form" onSubmit={handleRecordExpense}>
                            <div className="form-field">
                                <label>Expense Amount *</label>
                                <div className="money-input">
                                    <span>₹</span>
                                    <input type="number" min="1" step="1" placeholder="Enter amount" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} />
                                </div>
                            </div>

                            <div className="form-field">
                                <label>Expense Category *</label>
                                <select value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)}>
                                    <option value="">Select category</option>
                                    <option value="Construction Materials">Construction Materials</option>
                                    <option value="Labour">Labour</option>
                                    <option value="Equipment">Equipment</option>
                                    <option value="Transportation">Transportation</option>
                                    <option value="Administrative">Administrative</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="form-field">
                                <label>Description *</label>
                                <textarea rows="4" placeholder="Describe what the money was spent on..." value={expenseDescription} onChange={(e) => setExpenseDescription(e.target.value)} />
                            </div>

                            <div className="form-field">
                                <label>Paid To</label>
                                <input type="text" placeholder="Contractor / Supplier / Person" value={expensePaidTo} onChange={(e) => setExpensePaidTo(e.target.value)} />
                            </div>

                            <div className="form-field">
                                <label>Proof / Evidence Photos</label>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/jpg"
                                    multiple
                                    onChange={handleEvidenceChange}
                                />
                                <small>
                                    {expenseEvidence.length}/5 photos selected. Add photos one by one or select multiple at once. JPG, JPEG or PNG only; max 5 MB each.
                                </small>

                                {expenseEvidence.length > 0 && (
                                    <div style={{ marginTop: 10 }}>
                                        {expenseEvidence.map((file, index) => (
                                            <div
                                                key={`${file.name}-${index}`}
                                                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "7px 10px", marginBottom: 6, border: "1px solid #e2e8f0", borderRadius: 6 }}
                                            >
                                                <span>{index + 1}. {file.name}</span>
                                                <button type="button" className="cancel-button" onClick={() => removeEvidenceFile(index)}>Remove</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {expenseError && <div className="form-error">⚠ {expenseError}</div>}
                            {expenseSuccess && <div className="form-success">✓ {expenseSuccess}</div>}

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={() => {
                                        setShowExpenseForm(false);
                                        resetExpenseForm();
                                    }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="action-button primary" disabled={expenseLoading}>
                                    {expenseLoading ? "Recording..." : "Record Expense"}
                                </button>
                            </div>
                        </form>
                    </section>
                )}
            </section>
        </div>
    );
}

export default ProjectDetails;
