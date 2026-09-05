const { ethers } = require("ethers");

const artifact = require(
    "../blockchain/GovernmentFundABI.json"
);

const rpcUrl =
    process.env.BLOCKCHAIN_RPC_URL;

const contractAddress =
    process.env.BLOCKCHAIN_CONTRACT_ADDRESS;

const adminPrivateKey =
    process.env.BLOCKCHAIN_ADMIN_PRIVATE_KEY;

if (
    !rpcUrl ||
    !contractAddress ||
    !adminPrivateKey
) {
    throw new Error(
        "Blockchain environment variables are missing"
    );
}

const provider =
    new ethers.JsonRpcProvider(rpcUrl);

const adminWallet =
    new ethers.Wallet(
        adminPrivateKey,
        provider
    );

// Prevent nonce problems when several
// blockchain transactions are sent.
const adminSigner =
    new ethers.NonceManager(adminWallet);

const contract =
    new ethers.Contract(
        contractAddress,
        artifact.abi,
        adminSigner
    );


// ========================================
// CREATE PROJECT
// ========================================

async function createBlockchainProject(
    projectId,
    name
) {

    const tx =
        await contract.createProject(
            projectId,
            name
        );

    console.log(
        "Blockchain transaction:",
        tx.hash
    );

    const receipt =
        await tx.wait();

    return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
    };
}


// ========================================
// ALLOCATE FUND
// ========================================

async function allocateBlockchainFund(
    blockchainProjectId,
    amount
) {

    const tx =
        await contract.allocateFund(
            blockchainProjectId,
            amount
        );

    console.log(
        "Fund allocation transaction:",
        tx.hash
    );

    const receipt =
        await tx.wait();

    return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
    };
}


// ========================================
// RELEASE FUND
// ========================================

async function releaseBlockchainFund(
    blockchainProjectId,
    amount
) {

    const tx =
        await contract.releaseFund(
            blockchainProjectId,
            amount
        );

    console.log(
        "Fund release transaction:",
        tx.hash
    );

    const receipt =
        await tx.wait();

    return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
    };
}


// ========================================
// RECORD EXPENSE WITH EVIDENCE
// ========================================

async function recordBlockchainExpense(
    blockchainProjectId,
    expenseId,
    amount,
    evidenceHash
) {

    if (
        blockchainProjectId === undefined ||
        blockchainProjectId === null
    ) {
        throw new Error(
            "Blockchain project ID is required"
        );
    }

    if (!expenseId) {
        throw new Error(
            "Expense ID is required"
        );
    }

    if (
        amount === undefined ||
        amount === null ||
        Number(amount) <= 0
    ) {
        throw new Error(
            "Expense amount must be greater than zero"
        );
    }

    /*
     * If no evidence was uploaded,
     * use bytes32(0).
     *
     * Solidity accepts:
     * 0x0000000000000000000000000000000000000000000000000000000000000000
     */
    const finalEvidenceHash =
        evidenceHash ||
        ethers.ZeroHash;


    console.log(
        "========== BLOCKCHAIN EXPENSE =========="
    );

    console.log(
        "Blockchain Project ID:",
        blockchainProjectId
    );

    console.log(
        "Expense ID:",
        expenseId
    );

    console.log(
        "Amount:",
        amount
    );

    console.log(
        "Evidence Hash:",
        finalEvidenceHash
    );

    console.log(
        "========================================="
    );


    // Convert amount to BigInt
    const blockchainAmount =
        BigInt(amount);


    const tx =
        await contract.recordExpense(
            blockchainProjectId,
            expenseId,
            blockchainAmount,
            finalEvidenceHash
        );


    console.log(
        "Expense blockchain transaction:",
        tx.hash
    );


    const receipt =
        await tx.wait();


    console.log(
        "Expense blockchain block:",
        receipt.blockNumber
    );


    return {
        transactionHash:
            tx.hash,

        blockNumber:
            receipt.blockNumber,

        blockchainProjectId:
            blockchainProjectId.toString(),

        expenseId:
            expenseId,

        amount:
            blockchainAmount.toString(),

        evidenceHash:
            finalEvidenceHash
    };
}


// ========================================
// COMPLETE PROJECT
// ========================================

async function completeBlockchainProject(
    blockchainProjectId
) {

    const tx =
        await contract.completeProject(
            blockchainProjectId
        );

    console.log(
        "Project completion transaction:",
        tx.hash
    );

    const receipt =
        await tx.wait();

    return {
        transactionHash:
            tx.hash,

        blockNumber:
            receipt.blockNumber
    };
}


// ========================================
// GET PROJECT
// ========================================

async function getBlockchainProject(
    blockchainProjectId
) {

    const project =
        await contract.getProject(
            blockchainProjectId
        );

    return {
        id:
            project.id.toString(),

        projectId:
            project.projectId,

        name:
            project.name,

        allocatedAmount:
            project.allocatedAmount.toString(),

        releasedAmount:
            project.releasedAmount.toString(),

        spentAmount:
            project.spentAmount.toString(),

        status:
            project.status.toString(),

        active:
            project.active
    };
}


// ========================================
// GET TRANSACTION
// ========================================

async function getBlockchainTransaction(
    blockchainProjectId,
    transactionIndex
) {

    const transaction =
        await contract.getTransaction(
            blockchainProjectId,
            transactionIndex
        );

    return {
        projectId:
            transaction.projectId.toString(),

        transactionType:
            transaction.transactionType,

        amount:
            transaction.amount.toString(),

        performedBy:
            transaction.performedBy,

        timestamp:
            transaction.timestamp.toString(),

        expenseId:
            transaction.expenseId,

        evidenceHash:
            transaction.evidenceHash
    };
}


// ========================================
// GET TRANSACTION COUNT
// ========================================

async function getBlockchainTransactionCount(
    blockchainProjectId
) {

    const count =
        await contract.getTransactionCount(
            blockchainProjectId
        );

    return count.toString();
}


// ========================================
// EXPORTS
// ========================================

module.exports = {

    createBlockchainProject,

    allocateBlockchainFund,

    releaseBlockchainFund,

    recordBlockchainExpense,

    completeBlockchainProject,

    getBlockchainProject,

    getBlockchainTransaction,

    getBlockchainTransactionCount

};