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
        "GOVERNMENT PROJECT BLOCKCHAIN MIGRATION"
    );
    console.log(
        "=========================================="
    );

    console.log(
        "Contract:",
        CONTRACT_ADDRESS
    );

    console.log(
        "Wallet:",
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
    // GET PROJECTS
    // ==================================================

    const projects =
        await Project.find({
            projectId: {
                $regex: /^PRJ\d+$/
            }
        })
        .sort({
            projectId: 1
        });


    console.log(
        `Found ${projects.length} projects`
    );


    if (projects.length === 0) {

        console.log(
            "No PRJ projects found."
        );

        await mongoose.disconnect();

        return;
    }


    // ==================================================
    // IMPORTANT
    // ==================================================
    //
    // 
// The blockchain was freshly deployed.
// No TEST001 should be created.
// Real projects start at blockchain ID 1.
    //
    // ==================================================

    let blockchainProjectId = 1;


    // ==================================================
    // PROCESS PROJECTS
    // ==================================================

    for (
        const project of projects
    ) {

        console.log("");
        console.log(
            "------------------------------------------"
        );

        console.log(
            "Mongo Project:",
            project.projectId
        );

        console.log(
            "Name:",
            project.name
        );

        console.log(
            "Current Blockchain ID:",
            project.blockchainProjectId
        );


        // ==================================================
        // CHECK WHETHER THIS PROJECT IS ALREADY CORRECT
        // ==================================================

        if (
            project.blockchainProjectId &&
            Number(
                project.blockchainProjectId
            ) === blockchainProjectId
        ) {

            console.log(
                "Already correctly mapped."
            );

            blockchainProjectId++;

            continue;
        }


        // ==================================================
        // CHECK WHETHER BLOCKCHAIN PROJECT EXISTS
        // ==================================================

        let exists = false;

        try {

            const existing =
                await contract.getProject(
                    blockchainProjectId
                );

            if (
                existing &&
                existing.active
            ) {

                console.log(
                    "Blockchain project already exists:",
                    existing.projectId
                );

                exists = true;
            }

        } catch (error) {

            exists = false;
        }


        // ==================================================
        // CREATE BLOCKCHAIN PROJECT
        // ==================================================

        if (!exists) {

            console.log(
                "Creating blockchain project..."
            );

            const tx =
                await contract.createProject(
                    project.projectId,
                    project.name
                );

            console.log(
                "Transaction:",
                tx.hash
            );

            const receipt =
                await tx.wait();

            console.log(
                "Confirmed in block:",
                receipt.blockNumber
            );
        }


        // ==================================================
        // UPDATE MONGODB MAPPING
        // ==================================================

        project.blockchainProjectId =
            blockchainProjectId.toString();

        await project.save();


        console.log(
            "MongoDB updated:"
        );

        console.log(
            `${project.projectId} → blockchain ${blockchainProjectId}`
        );


        blockchainProjectId++;
    }


    // ==================================================
    // FINAL VERIFICATION
    // ==================================================

    console.log("");
    console.log(
        "=========================================="
    );

    console.log(
        "FINAL PROJECT MAPPINGS"
    );

    console.log(
        "=========================================="
    );


    const finalProjects =
        await Project.find({
            projectId: {
                $regex: /^PRJ\d+$/
            }
        })
        .sort({
            projectId: 1
        })
        .select(
            "projectId name blockchainProjectId"
        )
        .lean();


    for (
        const project of finalProjects
    ) {

        console.log(
            `${project.projectId} | ${project.name} | Blockchain ID: ${project.blockchainProjectId}`
        );
    }


    console.log("");
    console.log(
        "=========================================="
    );

    console.log(
        "MIGRATION COMPLETE"
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
            "MIGRATION FAILED"
        );

        console.error(
            error
        );

        try {
            await mongoose.disconnect();
        } catch (_) {}

        process.exit(1);
    }
);