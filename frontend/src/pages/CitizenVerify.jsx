import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import API from "../services/api";
import "../styles/citizenVerify.css";


function CitizenVerify() {

    const { projectId } = useParams();

    const [project, setProject] =
        useState(null);

    const [transactions, setTransactions] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [expenses, setExpenses] =
        useState([]);

    useEffect(() => {

        const loadVerificationData =
            async () => {
                try {

                    const expenseResponse =
                        await API.get(
                            `/projects/${projectId}/expenses`
                        );

                    setExpenses(
                        expenseResponse.data.expenses || []
                    );

                } catch (expenseError) {

                    console.error(
                        "Expense history error:",
                        expenseError
                    );

                    setExpenses([]);

                }                

                try {

                    setLoading(true);
                    setError("");

                    const projectResponse =
                        await API.get(
                            `/projects/${projectId}`
                        );

                    setProject(
                        projectResponse.data.project ||
                        projectResponse.data
                    );


                    try {

                        const transactionResponse =
                            await API.get(
                                `/projects/${projectId}/transactions`
                            );

                        setTransactions(
                            transactionResponse.data.transactions ||
                            []
                        );

                    } catch (transactionError) {

                        console.error(
                            "Transaction history error:",
                            transactionError
                        );

                        setTransactions([]);

                    }

                } catch (requestError) {

                    console.error(
                        "Verification error:",
                        requestError
                    );

                    setError(
                        requestError.response?.data?.message ||
                        "Unable to load project verification details."
                    );

                } finally {

                    setLoading(false);

                }

            };


        if (projectId) {
            loadVerificationData();
        }

    }, [projectId]);


    const formatAmount = (amount) => {

        return Number(
            amount || 0
        ).toLocaleString(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0
            }
        );

    };


    const formatDate = (timestamp) => {

        if (!timestamp) {
            return "Unknown";
        }

        const numericTimestamp =
            Number(timestamp);

        const date =
            numericTimestamp > 100000000000
                ? new Date(numericTimestamp)
                : new Date(
                    numericTimestamp * 1000
                );

        if (Number.isNaN(date.getTime())) {
            return "Unknown";
        }

        return date.toLocaleString(
            "en-IN",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );

    };


    const getTransactionLabel = (type) => {

        switch (type) {

            case "FUND_ALLOCATION":
                return "Fund Allocation";

            case "FUND_RELEASE":
                return "Fund Release";

            case "EXPENSE":
                return "Expense";

            default:
                return type || "Transaction";

        }

    };


    if (loading) {

        return (
            <div className="verify-page">

                <div className="verify-loading">

                    <div className="verify-spinner">
                        ⛓
                    </div>

                    <h2>
                        Verifying Project
                    </h2>

                    <p>
                        Loading blockchain and
                        project information...
                    </p>

                </div>

            </div>
        );

    }


    if (error || !project) {

        return (
            <div className="verify-page">

                <div className="verify-error-card">

                    <div className="verify-error-icon">
                        !
                    </div>

                    <h2>
                        Project Verification Failed
                    </h2>

                    <p>
                        {error ||
                            "Project could not be found."}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            window.location.href = "/projects"
                        }
                        className="verify-back-button"
                    >
                        View Projects
                    </button>

                </div>

            </div>
        );

    }


    const allocated =
        Number(
            project.allocatedAmount || 0
        );

    const released =
        Number(
            project.releasedAmount || 0
        );

    const spent =
        Number(
            project.spentAmount || 0
        );

    const available =
        Math.max(
            released - spent,
            0
        );


    const spendingPercentage =
        released > 0
            ? Math.min(
                (spent / released) * 100,
                100
            )
            : 0;


    return (
        <div className="verify-page">

            {/* HEADER */}

            <header className="verify-header">

                <div>

                    <div className="verify-brand">
                        Government Fund Portal
                    </div>

                    <div className="verify-header-subtitle">
                        Public Project Verification
                    </div>

                </div>

                <div className="verify-secure-badge">
                    ✓ Blockchain Secured
                </div>

            </header>


            {/* MAIN */}

            <main className="verify-container">

                {/* VERIFIED BANNER */}

                <section className="verify-banner">

                    <div className="verify-check">
                        ✓
                    </div>

                    <div>

                        <strong>
                            Project Verification
                        </strong>

                        <p>
                            This information is publicly
                            available for transparency
                            and verification.
                        </p>

                    </div>

                </section>


                {/* PROJECT INFORMATION */}

                <section className="verify-card">

                    <div className="verify-card-label">
                        GOVERNMENT PROJECT
                    </div>

                    <div className="verify-project-heading">

                        <div>

                            <h1>
                                {project.name}
                            </h1>

                            <div className="verify-project-id">
                                Project ID:{" "}
                                <strong>
                                    {project.projectId}
                                </strong>
                            </div>

                        </div>

                        <span
                            className={`verify-status verify-status-${String(
                                project.status || ""
                            ).toLowerCase()}`}
                        >
                            {project.status ||
                                "UNKNOWN"}
                        </span>

                    </div>


                    {project.description && (
                        <p className="verify-description">
                            {project.description}
                        </p>
                    )}


                    <div className="verify-location-grid">

                        <div>
                            <span>
                                Village
                            </span>

                            <strong>
                                {project.village ||
                                    "Not available"}
                            </strong>
                        </div>

                        <div>
                            <span>
                                District
                            </span>

                            <strong>
                                {project.district ||
                                    "Not available"}
                            </strong>
                        </div>

                        <div>
                            <span>
                                Assigned Officer
                            </span>

                            <strong>
                                {project.officer ||
                                    "Not available"}
                            </strong>
                        </div>

                    </div>

                </section>


                {/* FINANCIAL SUMMARY */}

                <section className="verify-card">

                    <div className="verify-section-title">

                        <div>

                            <h2>
                                Fund Transparency
                            </h2>

                            <p>
                                Public financial summary
                            </p>

                        </div>

                        <span className="verify-lock">
                            🔒 Read Only
                        </span>

                    </div>


                    <div className="verify-finance-grid">

                        <div className="verify-finance-card">

                            <span>
                                Allocated
                            </span>

                            <strong>
                                {formatAmount(
                                    allocated
                                )}
                            </strong>

                        </div>


                        <div className="verify-finance-card">

                            <span>
                                Released
                            </span>

                            <strong>
                                {formatAmount(
                                    released
                                )}
                            </strong>

                        </div>


                        <div className="verify-finance-card">

                            <span>
                                Spent
                            </span>

                            <strong>
                                {formatAmount(
                                    spent
                                )}
                            </strong>

                        </div>


                        <div className="verify-finance-card">

                            <span>
                                Available
                            </span>

                            <strong>
                                {formatAmount(
                                    available
                                )}
                            </strong>

                        </div>

                    </div>


                    <div className="verify-progress">

                        <div className="verify-progress-header">

                            <span>
                                Released funds utilized
                            </span>

                            <strong>
                                {spendingPercentage.toFixed(1)}%
                            </strong>

                        </div>

                        <div className="verify-progress-track">

                            <div
                                className="verify-progress-fill"
                                style={{
                                    width:
                                        `${spendingPercentage}%`
                                }}
                            />

                        </div>

                    </div>

                </section>


                {/* BLOCKCHAIN STATUS */}

                <section className="verify-blockchain-card">

                    <div className="verify-blockchain-icon">
                        ⛓
                    </div>

                    <div>

                        <span>
                            BLOCKCHAIN STATUS
                        </span>

                        <h2>
                            {project.blockchainStatus ===
                            "CONFIRMED"
                                ? "Blockchain Verified"
                                : "Blockchain Verification Pending"}
                        </h2>

                        <p>
                            Project records are linked
                            to the blockchain project
                            ID{" "}
                            <strong>
                                {project.blockchainProjectId ||
                                    "N/A"}
                            </strong>.
                        </p>

                        {project.blockchainTransactionHash && (
                            <div className="verify-hash">

                                Creation Transaction:

                                <code>
                                    {
                                        project.blockchainTransactionHash
                                    }
                                </code>

                            </div>
                        )}

                    </div>

                </section>

{/* ========================================= */}
{/* EXPENSE DETAILS */}
{/* ========================================= */}

<section className="verify-card">

    <div className="verify-section-title">

        <div>

            <h2>
                Project Expenses
            </h2>

            <p>
                Detailed expenditure records
            </p>

        </div>

        <span className="verify-count">
            {expenses.length} Expenses
        </span>

    </div>


    {expenses.length === 0 ? (

        <div className="verify-empty">

            No detailed expense records
            are currently available.

        </div>

    ) : (

        <div className="verify-expenses">

            {expenses.map(
                (expense, index) => (

                    <div
                        className="verify-expense-card"
                        key={
                            expense._id ||
                            index
                        }
                    >

                        <div className="verify-expense-header">

                            <div>

                                <span className="verify-expense-label">
                                    EXPENSE #{index + 1}
                                </span>

                                <h3>
                                    {expense.category}
                                </h3>

                            </div>

                            <strong>
                                {formatAmount(
                                    expense.amount
                                )}
                            </strong>

                        </div>


                        <div className="verify-expense-description">

                            <span>
                                Description
                            </span>

                            <p>
                                {expense.description}
                            </p>

                        </div>


                        <div className="verify-expense-details">

                            <div>

                                <span>
                                    Paid To
                                </span>

                                <strong>
                                    {expense.paidTo ||
                                        "Not specified"}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Recorded By
                                </span>

                                <strong>
                                    {expense.recordedBy ||
                                        "Not specified"}
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Date
                                </span>

                                <strong>
                                    {expense.createdAt
                                        ? new Date(
                                            expense.createdAt
                                        ).toLocaleDateString(
                                            "en-IN"
                                        )
                                        : "Unknown"}
                                </strong>

                            </div>

                        </div>


                        {expense.blockchainTransactionHash && (
                            <div className="verify-expense-blockchain">

                                ✓ Blockchain Transaction

                                <code>
                                    {
                                        expense.blockchainTransactionHash
                                    }
                                </code>

                            </div>
                        )}

                    </div>

                )
            )}

        </div>

    )}

</section>

{/* ================================= */}
{/* EXPENSE HISTORY */}
{/* ================================= */}

<section className="expense-history-section">

    <div className="expense-history-header">

        <div>
            <h3>Expense History</h3>

            <p>
                Recorded project expenses and supporting evidence.
            </p>
        </div>

        <span className="expense-count-badge">
            {expenses.length}{" "}
            {expenses.length === 1
                ? "Expense"
                : "Expenses"}
        </span>

    </div>


    {/* SUMMARY */}

    {expenses.length > 0 && (
        <div className="expense-summary">

            <div>
                <span>Total Expenses</span>

                <strong>
                    {expenses.length}
                </strong>
            </div>

            <div>
                <span>Total Spent</span>

                <strong>
                    {formatMoney(
                        expenses.reduce(
                            (total, expense) =>
                                total +
                                Number(
                                    expense.amount || 0
                                ),
                            0
                        )
                    )}
                </strong>
            </div>

            <div>
                <span>Evidence Photos</span>

                <strong>
                    {expenses.reduce(
                        (total, expense) =>
                            total +
                            (expense.evidence?.length || 0),
                        0
                    )}
                </strong>
            </div>

        </div>
    )}


    {/* TOGGLE */}

    <button
        type="button"
        className="expense-history-toggle"
        onClick={() =>
            setShowExpenseHistory(
                !showExpenseHistory
            )
        }
    >
        <span>
            {showExpenseHistory
                ? "Hide Expense History"
                : "View Expense History"}
        </span>

        <span>
            {showExpenseHistory
                ? "▲"
                : "▼"}
        </span>
    </button>


    {/* EXPENSE LIST */}

    {showExpenseHistory && (

        <div className="expense-list">

            {expensesLoading ? (

                <div className="expense-message">
                    Loading expense history...
                </div>

            ) : expenses.length === 0 ? (

                <div className="expense-message">
                    No expenses have been recorded yet.
                </div>

            ) : (

                expenses.map((expense, index) => {

                    const isOpen =
                        expandedExpense ===
                        expense._id;

                    const evidence =
                        expense.evidence || [];

                    return (
                        <div
                            key={
                                expense._id ||
                                index
                            }
                            className="expense-card"
                        >

                            {/* HEADER */}

                            <button
                                type="button"
                                className="expense-card-header"
                                onClick={() =>
                                    setExpandedExpense(
                                        isOpen
                                            ? null
                                            : expense._id
                                    )
                                }
                            >

                                <div className="expense-number">
                                    {index + 1}
                                </div>

                                <div className="expense-card-main">

                                    <strong>
                                        {expense.category ||
                                            "Expense"}
                                    </strong>

                                    <span>
                                        {expense.createdAt
                                            ? new Date(
                                                expense.createdAt
                                            ).toLocaleString(
                                                "en-IN"
                                            )
                                            : "Date unavailable"}
                                    </span>

                                </div>

                                <strong className="expense-card-amount">
                                    {formatMoney(
                                        Number(
                                            expense.amount || 0
                                        )
                                    )}
                                </strong>

                                <span className="expense-arrow">
                                    {isOpen ? "▲" : "▼"}
                                </span>

                            </button>


                            {/* DETAILS */}

                            {isOpen && (

                                <div className="expense-card-details">

                                    <div className="expense-info-grid">

                                        <div>
                                            <span>
                                                Description
                                            </span>

                                            <strong>
                                                {expense.description ||
                                                    "—"}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Paid To
                                            </span>

                                            <strong>
                                                {expense.paidTo ||
                                                    "—"}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Recorded By
                                            </span>

                                            <strong>
                                                {expense.recordedBy ||
                                                    "—"}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Amount
                                            </span>

                                            <strong>
                                                {formatMoney(
                                                    Number(
                                                        expense.amount ||
                                                            0
                                                    )
                                                )}
                                            </strong>
                                        </div>

                                    </div>


                                    {/* EVIDENCE */}

                                    <div className="expense-evidence">

                                        <div className="expense-evidence-title">

                                            <strong>
                                                Proof / Evidence
                                            </strong>

                                            <span>
                                                {evidence.length}{" "}
                                                {evidence.length === 1
                                                    ? "Photo"
                                                    : "Photos"}
                                            </span>

                                        </div>


                                        {evidence.length > 0 ? (

                                            <div className="expense-photo-grid">

                                                {evidence.map(
                                                    (
                                                        image,
                                                        imageIndex
                                                    ) => (

                                                        <a
                                                            key={
                                                                image.publicId ||
                                                                imageIndex
                                                            }
                                                            href={
                                                                image.url
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="expense-photo"
                                                        >

                                                            <img
                                                                src={
                                                                    image.url
                                                                }
                                                                alt={`Expense evidence ${
                                                                    imageIndex +
                                                                    1
                                                                }`}
                                                            />

                                                            <span>
                                                                View
                                                            </span>

                                                        </a>

                                                    )
                                                )}

                                            </div>

                                        ) : (

                                            <div className="no-expense-evidence">
                                                No evidence uploaded.
                                            </div>

                                        )}

                                    </div>


                                    {/* BLOCKCHAIN */}

                                    <div className="expense-blockchain-status">

                                        <span>✓</span>

                                        <div>
                                            <strong>
                                                Blockchain Recorded
                                            </strong>

                                            <p>
                                                This expense is linked
                                                to the project's
                                                blockchain history.
                                            </p>
                                        </div>

                                    </div>

                                </div>

                            )}

                        </div>
                    );

                })

            )}

        </div>

    )}

</section>
                {/* TRANSACTION HISTORY */}

                <section className="verify-card">

                    <div className="verify-section-title">

                        <div>

                            <h2>
                                Blockchain Transaction History
                            </h2>

                            <p>
                                Immutable project fund activity
                            </p>

                        </div>

                        <span className="verify-count">
                            {transactions.length} Transactions
                        </span>

                    </div>


                    {transactions.length === 0 ? (

                        <div className="verify-empty">

                            No blockchain transactions
                            are currently available.

                        </div>

                    ) : (

                        <div className="verify-transactions">

                            {transactions.map(
                                (transaction, index) => (

                                    <div
                                        className="verify-transaction"
                                        key={
                                            transaction.index ??
                                            index
                                        }
                                    >

                                        <div className="verify-transaction-number">
                                            {index + 1}
                                        </div>


                                        <div className="verify-transaction-main">

                                            <strong>
                                                {getTransactionLabel(
                                                    transaction.transactionType
                                                )}
                                            </strong>

                                            <span>
                                                Blockchain Project ID:{" "}
                                                {transaction.projectId ||
                                                    project.blockchainProjectId ||
                                                    "N/A"}
                                            </span>

                                            <span>
                                                {formatDate(
                                                    transaction.timestamp
                                                )}
                                            </span>

                                        </div>


                                        <div className="verify-transaction-amount">

                                            {formatAmount(
                                                transaction.amount
                                            )}

                                        </div>

                                    </div>

                                )
                            )}

                        </div>

                    )}

                </section>


                {/* FOOTER */}

                <footer className="verify-footer">

                    <div>
                        Government Fund Allocation &
                        Tracking System
                    </div>

                    <div>
                        Blockchain-based public transparency
                    </div>

                </footer>

            </main>

        </div>
    );
}


export default CitizenVerify;