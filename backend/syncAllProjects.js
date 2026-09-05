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
// HELPER
// ======================================================

function formatAmount(amount) {
    return Number(amount).toLocaleString("en-IN");
}

// ======================================================
// SYNCHRONIZE ONE PROJECT
// ======================================================

async function synchronizeProject(project) {

    const projectId =
        project.projectId;

    const blockchainProjectId =
        Number(
            project.blockchainProjectId
        );

    console.log("");
    console.log(
        "=================================================="
    );

    console.log(
        `PROJECT: ${projectId}`
    );

    console.log(
        `Name: ${project.name}`
    );

    console.log(
        `Blockchain ID: ${blockchainProjectId}`
    );

    console.log(
        "=================================================="
    );

    // ==================================================
    // VERIFY BLOCKCHAIN PROJECT
    // ==================================================

    let blockchainProject;

    try {

        blockchainProject =
            await contract.getProject(
                blockchainProjectId
            );

    } catch (error) {

        console.error(
            `❌ Cannot find blockchain project ${blockchainProjectId}`
        );

        console.error(
            error.message
        );

        return {
            success: false,
            projectId,
            reason: "BLOCKCHAIN_PROJECT_NOT_FOUND"
        };
    }

    console.log("");
    console.log(
        "Blockchain project:",
        blockchainProject.projectId
    );

    // ==================================================
    // CURRENT BLOCKCHAIN VALUES
    // ==================================================

    const blockchainAllocated =
        Number(
            blockchainProject.allocatedAmount
        );

    const blockchainReleased =
        Number(
            blockchainProject.releasedAmount
        );

    const blockchainSpent =
        Number(
            blockchainProject.spentAmount
        );

    // ==================================================
    // MONGODB VALUES
    // ==================================================

    const mongoAllocated =
        Number(
            project.allocatedAmount || 0
        );

    const mongoReleased =
        Number(
            project.releasedAmount || 0
        );

    const mongoSpent =
        Number(
            project.spentAmount || 0
        );

    console.log("");
    console.log(
        "MongoDB Financial State"
    );

    console.log(
        "Allocated:",
        `₹${formatAmount(mongoAllocated)}`
    );

    console.log(
        "Released:",
        `₹${formatAmount(mongoReleased)}`
    );

    console.log(
        "Spent:",
        `₹${formatAmount(mongoSpent)}`
    );

    console.log("");
    console.log(
        "Blockchain Financial State"
    );

    console.log(
        "Allocated:",
        `₹${formatAmount(blockchainAllocated)}`
    );

    console.log(
        "Released:",
        `₹${formatAmount(blockchainReleased)}`
    );

    console.log(
        "Spent:",
        `₹${formatAmount(blockchainSpent)}`
    );

    // ==================================================
    // ALLOCATION SYNCHRONIZATION
    // ==================================================

    if (
        mongoAllocated >
        blockchainAllocated
    ) {

        const allocationToAdd =
            mongoAllocated -
            blockchainAllocated;

        console.log("");
        console.log(
            `→ Allocating ₹${formatAmount(allocationToAdd)}`
        );

        const tx =
            await contract.allocateFund(
                blockchainProjectId,
                BigInt(allocationToAdd)
            );

        console.log(
            "Allocation TX:",
            tx.hash
        );

        await tx.wait();

        console.log(
            "✓ Allocation confirmed"
        );

    } else if (
        mongoAllocated ===
        blockchainAllocated
    ) {

        console.log(
            "✓ Allocation already synchronized"
        );

    } else {

        console.log(
            "⚠ Blockchain allocation is greater than MongoDB allocation"
        );

        console.log(
            "No allocation will be reduced."
        );
    }

    // ==================================================
    // RELEASE SYNCHRONIZATION
    // ==================================================

    blockchainProject =
        await contract.getProject(
            blockchainProjectId
        );

    const updatedBlockchainAllocated =
        Number(
            blockchainProject.allocatedAmount
        );

    const updatedBlockchainReleased =
        Number(
            blockchainProject.releasedAmount
        );

    if (
        mongoReleased >
        updatedBlockchainReleased
    ) {

        const releaseToAdd =
            mongoReleased -
            updatedBlockchainReleased;

        if (
            updatedBlockchainReleased +
            releaseToAdd >
            updatedBlockchainAllocated
        ) {

            console.error(
                `❌ Cannot release ₹${formatAmount(releaseToAdd)}`
            );

            console.error(
                "Release would exceed allocation."
            );

            return {
                success: false,
                projectId,
                reason: "RELEASE_EXCEEDS_ALLOCATION"
            };
        }

        console.log("");
        console.log(
            `→ Releasing ₹${formatAmount(releaseToAdd)}`
        );

        const tx =
            await contract.releaseFund(
                blockchainProjectId,
                BigInt(releaseToAdd)
            );

        console.log(
            "Release TX:",
            tx.hash
        );

        await tx.wait();

        console.log(
            "✓ Release confirmed"
        );

    } else if (
        mongoReleased ===
        updatedBlockchainReleased
    ) {

        console.log(
            "✓ Release already synchronized"
        );

    } else {

        console.log(
            "⚠ Blockchain release is greater than MongoDB release"
        );

        console.log(
            "No release will be reduced."
        );
    }

    // ==================================================
    // EXPENSE SYNCHRONIZATION
    // ==================================================

    console.log("");
    console.log(
        "Checking unsynchronized expenses..."
    );

    const expenses =
        await Expense.find({

            projectId: projectId,

            $or: [
                {
                    blockchainTransactionHash:
                        null
                },
                {
                    blockchainTransactionHash: {
                        $exists: false
                    }
                },
                {
                    blockchainTransactionHash:
                        ""
                }
            ]

        }).sort({
            createdAt: 1
        });

    console.log(
        `Expenses requiring synchronization: ${expenses.length}`
    );

    let expensesSynchronized = 0;

    for (
        const expense of expenses
    ) {

        const expenseAmount =
            Number(
                expense.amount
            );

        if (
            !Number.isFinite(
                expenseAmount
            ) ||
            expenseAmount <= 0
        ) {

            console.error(
                `❌ Invalid expense amount: ${expense._id}`
            );

            continue;
        }

        // ----------------------------------------------
        // Refresh blockchain state
        // ----------------------------------------------

        blockchainProject =
            await contract.getProject(
                blockchainProjectId
            );

        const currentSpent =
            Number(
                blockchainProject.spentAmount
            );

        const currentReleased =
            Number(
                blockchainProject.releasedAmount
            );

        // ----------------------------------------------
        // Safety check
        // ----------------------------------------------

        if (
            currentSpent +
            expenseAmount >
            currentReleased
        ) {

            console.error("");

            console.error(
                `❌ Cannot synchronize expense ${expense._id}`
            );

            console.error(
                `Amount: ₹${formatAmount(expenseAmount)}`
            );

            console.error(
                `Current spent: ₹${formatAmount(currentSpent)}`
            );

            console.error(
                `Released: ₹${formatAmount(currentReleased)}`
            );

            console.error(
                "Expense skipped."
            );

            continue;
        }

        // ----------------------------------------------
        // Expense ID
        // ----------------------------------------------

        const expenseId =
            expense._id.toString();

        // ----------------------------------------------
        // Evidence hash
        // ----------------------------------------------
        //
        // Existing old expenses without evidence
        // use ZeroHash.
        //
        // New expenses recorded through the normal
        // application can contain a real evidence hash.
        // ----------------------------------------------

        let evidenceHash =
            ethers.ZeroHash;

        if (
            expense.blockchainEvidenceHash
        ) {

            evidenceHash =
                expense.blockchainEvidenceHash;
        }

        console.log("");
        console.log(
            "------------------------------------------"
        );

        console.log(
            "Recording expense"
        );

        console.log(
            "Expense ID:",
            expenseId
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
            `₹${formatAmount(expenseAmount)}`
        );

        console.log(
            "Evidence Hash:",
            evidenceHash
        );

        // ----------------------------------------------
        // RECORD ON BLOCKCHAIN
        // ----------------------------------------------

        const tx =
            await contract.recordExpense(
                blockchainProjectId,
                expenseId,
                BigInt(expenseAmount),
                evidenceHash
            );

        console.log(
            "Expense TX:",
            tx.hash
        );

        const receipt =
            await tx.wait();

        console.log(
            "Confirmed in block:",
            receipt.blockNumber
        );

        // ----------------------------------------------
        // SAVE TO MONGODB
        // ----------------------------------------------

        expense.blockchainTransactionHash =
            tx.hash;

        expense.blockchainEvidenceHash =
            evidenceHash;

        await expense.save();

        console.log(
            "✓ MongoDB expense updated"
        );

        expensesSynchronized++;
    }

    // ==================================================
    // FINAL STATE
    // ==================================================

    const finalProject =
        await contract.getProject(
            blockchainProjectId
        );

    const finalAllocated =
        Number(
            finalProject.allocatedAmount
        );

    const finalReleased =
        Number(
            finalProject.releasedAmount
        );

    const finalSpent =
        Number(
            finalProject.spentAmount
        );

    console.log("");
    console.log(
        "FINAL PROJECT STATE"
    );

    console.log(
        "Project:",
        projectId
    );

    console.log(
        "Blockchain ID:",
        blockchainProjectId
    );

    console.log(
        "Allocated:",
        `₹${formatAmount(finalAllocated)}`
    );

    console.log(
        "Released:",
        `₹${formatAmount(finalReleased)}`
    );

    console.log(
        "Spent:",
        `₹${formatAmount(finalSpent)}`
    );

    // ==================================================
    // RESULT
    // ==================================================

    return {
        success: true,
        projectId,
        blockchainProjectId,
        expensesSynchronized,
        allocated: finalAllocated,
        released: finalReleased,
        spent: finalSpent
    };
}

// ======================================================
// MAIN
// ======================================================

async function main() {

    console.log("");
    console.log(
        "======================================================"
    );

    console.log(
        " GOVERNMENT FUND - ALL PROJECT SYNCHRONIZATION"
    );

    console.log(
        "======================================================"
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
    // GET ALL BLOCKCHAIN PROJECTS
    // ==================================================

    const projects =
        await Project.find({
            blockchainProjectId: {
                $exists: true,
                $ne: null
            }
        }).sort({
            projectId: 1
        });

    console.log("");

    console.log(
        `Projects found: ${projects.length}`
    );

    if (
        projects.length === 0
    ) {

        console.log(
            "No projects require synchronization."
        );

        await mongoose.disconnect();

        return;
    }

    // ==================================================
    // SYNCHRONIZE EACH PROJECT
    // ==================================================

    const results = [];

    for (
        const project of projects
    ) {

        try {

            const result =
                await synchronizeProject(
                    project
                );

            results.push(result);

        } catch (error) {

            console.error("");

            console.error(
                `❌ ERROR IN ${project.projectId}`
            );

            console.error(
                error.message || error
            );

            results.push({
                success: false,
                projectId: project.projectId,
                reason: error.message
            });

            // Continue with the next project
            continue;
        }
    }

    // ==================================================
    // FINAL SUMMARY
    // ==================================================

    console.log("");
    console.log(
        "======================================================"
    );

    console.log(
        " SYNCHRONIZATION SUMMARY"
    );

    console.log(
        "======================================================"
    );

    for (
        const result of results
    ) {

        if (
            result.success
        ) {

            console.log(
                `✓ ${result.projectId} | Blockchain ID: ${result.blockchainProjectId} | Expenses synchronized: ${result.expensesSynchronized}`
            );

        } else {

            console.log(
                `❌ ${result.projectId} | ${result.reason}`
            );
        }
    }

    console.log("");
    console.log(
        "======================================================"
    );

    console.log(
        " ALL PROJECT SYNCHRONIZATION COMPLETE"
    );

    console.log(
        "======================================================"
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
            "======================================================"
        );

        console.error(
            " SYNCHRONIZATION FAILED"
        );

        console.error(
            "======================================================"
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