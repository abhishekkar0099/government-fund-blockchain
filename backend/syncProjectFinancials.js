require("dotenv").config();

const mongoose = require("mongoose");
const { ethers } = require("ethers");

const Project = require("./models/Project");

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

if (!RPC_URL)
    throw new Error("BLOCKCHAIN_RPC_URL is missing");

if (!CONTRACT_ADDRESS)
    throw new Error(
        "BLOCKCHAIN_CONTRACT_ADDRESS is missing"
    );

if (!PRIVATE_KEY)
    throw new Error(
        "BLOCKCHAIN_ADMIN_PRIVATE_KEY is missing"
    );

if (!MONGODB_URI)
    throw new Error(
        "MONGODB_URI is missing"
    );


// ======================================================
// BLOCKCHAIN
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
        "SYNC PROJECT FINANCIAL DATA"
    );
    console.log(
        "=========================================="
    );

    console.log(
        "MongoDB Project:",
        PROJECT_ID
    );

    console.log(
        "Contract:",
        CONTRACT_ADDRESS
    );

    console.log(
        "Admin wallet:",
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
    // GET PROJECT
    // ==================================================

    const project =
        await Project.findOne({
            projectId: PROJECT_ID
        });


    if (!project) {

        throw new Error(
            `Project ${PROJECT_ID} not found in MongoDB`
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


    console.log("");
    console.log(
        "Blockchain Project ID:",
        blockchainProjectId
    );


    // ==================================================
    // GET CURRENT BLOCKCHAIN PROJECT
    // ==================================================

    const blockchainProject =
        await contract.getProject(
            blockchainProjectId
        );


    console.log("");
    console.log(
        "Blockchain Project:"
    );

    console.log(
        "Project ID:",
        blockchainProject.projectId
    );

    console.log(
        "Name:",
        blockchainProject.name
    );

    console.log(
        "Current allocation:",
        blockchainProject.allocatedAmount.toString()
    );

    console.log(
        "Current release:",
        blockchainProject.releasedAmount.toString()
    );

    console.log(
        "Current spent:",
        blockchainProject.spentAmount.toString()
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


    console.log("");
    console.log(
        "MongoDB allocation:",
        mongoAllocated
    );

    console.log(
        "MongoDB release:",
        mongoReleased
    );


    // ==================================================
    // SAFETY CHECK
    // ==================================================

    const blockchainAllocated =
        Number(
            blockchainProject.allocatedAmount
        );

    const blockchainReleased =
        Number(
            blockchainProject.releasedAmount
        );


    if (
        blockchainAllocated > mongoAllocated
    ) {

        throw new Error(
            "Blockchain allocation is already greater than MongoDB allocation. Stopping to prevent inconsistency."
        );

    }


    if (
        blockchainReleased > mongoReleased
    ) {

        throw new Error(
            "Blockchain release is already greater than MongoDB release. Stopping to prevent inconsistency."
        );

    }


    // ==================================================
    // CALCULATE DIFFERENCES
    // ==================================================

    const allocationDifference =
        mongoAllocated -
        blockchainAllocated;

    const releaseDifference =
        mongoReleased -
        blockchainReleased;


    console.log("");
    console.log(
        "Allocation to add:",
        allocationDifference
    );

    console.log(
        "Release to add:",
        releaseDifference
    );


    // ==================================================
    // ALLOCATE FUND
    // ==================================================

    if (
        allocationDifference > 0
    ) {

        console.log("");
        console.log(
            "Adding allocation..."
        );

        const tx =
            await contract.allocateFund(
                blockchainProjectId,
                BigInt(
                    allocationDifference
                )
            );

        console.log(
            "Allocation transaction:",
            tx.hash
        );

        const receipt =
            await tx.wait();

        console.log(
            "Allocation confirmed in block:",
            receipt.blockNumber
        );

    } else {

        console.log(
            "Allocation already synchronized."
        );

    }


    // ==================================================
    // RELEASE FUND
    // ==================================================

    if (
        releaseDifference > 0
    ) {

        console.log("");
        console.log(
            "Adding release..."
        );

        const tx =
            await contract.releaseFund(
                blockchainProjectId,
                BigInt(
                    releaseDifference
                )
            );

        console.log(
            "Release transaction:",
            tx.hash
        );

        const receipt =
            await tx.wait();

        console.log(
            "Release confirmed in block:",
            receipt.blockNumber
        );

    } else {

        console.log(
            "Release already synchronized."
        );

    }


    // ==================================================
    // FINAL BLOCKCHAIN CHECK
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

    console.log(
        "Status:",
        finalProject.status.toString()
    );


    console.log("");
    console.log(
        "=========================================="
    );

    console.log(
        "FINANCIAL SYNCHRONIZATION COMPLETE"
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
            "SYNC FAILED"
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