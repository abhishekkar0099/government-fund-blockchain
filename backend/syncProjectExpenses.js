require("dotenv").config();

const mongoose = require("mongoose");
const { ethers } = require("ethers");

const Project = require("./models/Project");
const Expense = require("./models/Expense");

const artifact = require(
    "./blockchain/GovernmentFundABI.json"
);

// ======================================================
// CONFIGURATION
// ======================================================

const PROJECT_ID = "PRJ018";

const RPC_URL =
    process.env.BLOCKCHAIN_RPC_URL;

const CONTRACT_ADDRESS =
    process.env.BLOCKCHAIN_CONTRACT_ADDRESS;

const PRIVATE_KEY =
    process.env.BLOCKCHAIN_ADMIN_PRIVATE_KEY;

const MONGODB_URI =
    process.env.MONGODB_URI;

// ======================================================
// VALIDATION
// ======================================================

if (!RPC_URL) {
    throw new Error(
        "BLOCKCHAIN_RPC_URL is missing"
    );
}

if (!CONTRACT_ADDRESS) {
    throw new Error(
        "BLOCKCHAIN_CONTRACT_ADDRESS is missing"
    );
}

if (!PRIVATE_KEY) {
    throw new Error(
        "BLOCKCHAIN_ADMIN_PRIVATE_KEY is missing"
    );
}

if (!MONGODB_URI) {
    throw new Error(
        "MONGODB_URI is missing"
    );
}

// ======================================================
// BLOCKCHAIN CONNECTION
// ======================================================

const provider =
    new ethers.JsonRpcProvider(
        RPC_URL
    );

const wallet =
    new ethers.Wallet(
        PRIVATE_KEY,
        provider
    );

const signer =
    new ethers.NonceManager(
        wallet
    );

const contract =
    new ethers.Contract(
        CONTRACT_ADDRESS,
        artifact.abi,
        signer
    );

// ======================================================
// MAIN
// ======================================================

async function main() {

    console.log("");
    console.log(
        "=========================================="
    );

    console.log(
        "SYNC EXISTING PROJECT EXPENSES"
    );

    console.log(
        "=========================================="
    );

    console.log(
        "Project:",
        PROJECT_ID
    );

    console.log(
        "Contract:",
        CONTRACT_ADDRESS
    );

    console.log(
        "Admin:",
        wallet.address
    );

    // ==================================================
    // CONNECT MONGODB
    // ==================================================

    await mongoose.connect(
        MONGODB_URI
    );

    console.log(
        "MongoDB connected"
    );

    // ==================================================
    // FIND PROJECT
    // ==================================================

    const project =
        await Project.findOne({
            projectId: PROJECT_ID
        });

    if (!project) {
        throw new Error(
            `${PROJECT_ID} not found in MongoDB`
        );
    }

    if (
        !project.blockchainProjectId
    ) {
        throw new Error(
            `${PROJECT_ID} has no blockchainProjectId`
        );
    }

    const blockchainProjectId =
        Number(
            project.blockchainProjectId
        );

    console.log(
        "Blockchain Project ID:",
        blockchainProjectId
    );

    // ==================================================
    // VERIFY BLOCKCHAIN PROJECT
    // ==================================================

    const blockchainProject =
        await contract.getProject(
            blockchainProjectId
        );

    console.log("");
    console.log(
        "Blockchain project:",
        blockchainProject.projectId
    );

    console.log(
        "Allocated:",
        blockchainProject.allocatedAmount.toString()
    );

    console.log(
        "Released:",
        blockchainProject.releasedAmount.toString()
    );

    console.log(
        "Spent:",
        blockchainProject.spentAmount.toString()
    );

    // ==================================================
    // GET UNSYNCHRONIZED EXPENSES
    // ==================================================

    const expenses =
        await Expense.find({
            projectId: PROJECT_ID,

            $or: [
                {
                    blockchainTransactionHash: null
                },
                {
                    blockchainTransactionHash: {
                        $exists: false
                    }
                },
                {
                    blockchainTransactionHash: ""
                }
            ]
        }).sort({
            createdAt: 1
        });

    console.log("");
    console.log(
        "Expenses requiring synchronization:",
        expenses.length
    );

    if (
        expenses.length === 0
    ) {
        console.log(
            "No expenses need synchronization."
        );

        await mongoose.disconnect();

        return;
    }

    // ==================================================
    // CALCULATE TOTAL
    // ==================================================

    let totalExpense = 0;

    for (
        const expense of expenses
    ) {

        const amount =
            Number(
                expense.amount
            );

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            throw new Error(
                `Invalid expense amount for ${expense._id}: ${expense.amount}`
            );
        }

        totalExpense += amount;
    }

    console.log(
        "Total expenses to synchronize:",
        totalExpense
    );

    // ==================================================
    // SAFETY CHECK
    // ==================================================

    const currentSpent =
        Number(
            blockchainProject.spentAmount
        );

    const released =
        Number(
            blockchainProject.releasedAmount
        );

    if (
        currentSpent +
        totalExpense >
        released
    ) {
        throw new Error(
            `Expenses exceed released funds. Current spent: ${currentSpent}, expenses to add: ${totalExpense}, released: ${released}`
        );
    }

    // ==================================================
    // PROCESS EACH EXPENSE
    // ==================================================

    for (
        const expense of expenses
    ) {

        console.log("");
        console.log(
            "------------------------------------------"
        );

        console.log(
            "Expense:",
            expense._id.toString()
        );

        console.log(
            "Category:",
            expense.category
        );

        console.log(
            "Description:",
            expense.description
        );

        console.log(
            "Amount:",
            expense.amount
        );

        // ==================================================
        // FINAL SAFETY CHECK
        // ==================================================

        const current =
            await contract.getProject(
                blockchainProjectId
            );

        const currentSpentAmount =
            Number(
                current.spentAmount
            );

        const currentReleasedAmount =
            Number(
                current.releasedAmount
            );

        const expenseAmount =
            Number(
                expense.amount
            );

        if (
            currentSpentAmount +
            expenseAmount >
            currentReleasedAmount
        ) {
            throw new Error(
                `Cannot synchronize expense ${expense._id}: released funds would be exceeded`
            );
        }

        // ==================================================
        // RECORD EXPENSE ON BLOCKCHAIN
        // ==================================================

        console.log(
            "Recording expense on blockchain..."
        );

        // Expense ID
        const expenseId =
            expense._id.toString();

        // Existing expenses do not have
        // an evidence hash, so use ZeroHash.
        const evidenceHash =
            ethers.ZeroHash;

        console.log(
            "Expense ID:",
            expenseId
        );

        console.log(
            "Evidence Hash:",
            evidenceHash
        );

        // Current ABI expects 4 arguments:
        //
        // recordExpense(
        //     uint256 projectId,
        //     string expenseId,
        //     uint256 amount,
        //     bytes32 evidenceHash
        // )

        const tx =
            await contract.recordExpense(
                blockchainProjectId,
                expenseId,
                BigInt(expenseAmount),
                evidenceHash
            );

        console.log(
            "Blockchain transaction:",
            tx.hash
        );

        const receipt =
            await tx.wait();

        console.log(
            "Confirmed in block:",
            receipt.blockNumber
        );

        // ==================================================
        // SAVE BLOCKCHAIN INFORMATION TO MONGODB
        // ==================================================

        expense.blockchainTransactionHash =
            tx.hash;

        expense.blockchainEvidenceHash =
            evidenceHash;

        await expense.save();

        console.log(
            "MongoDB updated successfully."
        );

        console.log(
            "Expense:",
            expense._id.toString()
        );

        console.log(
            "Transaction hash:",
            tx.hash
        );
    }

    // ==================================================
    // FINAL BLOCKCHAIN STATE
    // ==================================================

    const finalProject =
        await contract.getProject(
            blockchainProjectId
        );

    console.log("");
    console.log(
        "=========================================="
    );

    console.log(
        "FINAL BLOCKCHAIN STATE"
    );

    console.log(
        "=========================================="
    );

    console.log(
        "Project:",
        finalProject.projectId
    );

    console.log(
        "Blockchain ID:",
        finalProject.id.toString()
    );

    console.log(
        "Allocated:",
        finalProject.allocatedAmount.toString()
    );

    console.log(
        "Released:",
        finalProject.releasedAmount.toString()
    );

    console.log(
        "Spent:",
        finalProject.spentAmount.toString()
    );

    console.log("");
    console.log(
        "=========================================="
    );

    console.log(
        "EXPENSE SYNCHRONIZATION COMPLETE"
    );

    console.log(
        "=========================================="
    );

    await mongoose.disconnect();
}

// ======================================================
// RUN
// ======================================================

main().catch(
    async (error) => {

        console.error("");

        console.error(
            "=========================================="
        );

        console.error(
            "EXPENSE SYNCHRONIZATION FAILED"
        );

        console.error(
            "=========================================="
        );

        console.error(
            error.message || error
        );

        try {
            await mongoose.disconnect();
        } catch (_) {}

        process.exit(1);
    }
);