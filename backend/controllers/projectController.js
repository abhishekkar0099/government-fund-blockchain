const Project = require("../models/Project");
const { contract } = require("../blockchain");


// ============================================================
// CREATE PROJECT
// POST /api/projects
// ============================================================

const createProject = async (req, res) => {

    try {

        const {
            projectId,
            name,
            description,
            village,
            district,
            officer
        } = req.body || {};


        // ====================================================
        // VALIDATION
        // ====================================================

        if (!projectId || !name) {

            return res.status(400).json({
                message: "projectId and name are required"
            });

        }


        // ====================================================
        // CHECK DUPLICATE PROJECT
        // ====================================================

        const existingProject =
            await Project.findOne({
                projectId
            });


        if (existingProject) {

            return res.status(400).json({
                message:
                    "Project with this projectId already exists"
            });

        }


        // ====================================================
        // CREATE PROJECT ON BLOCKCHAIN
        // ====================================================

        console.log(
            "Creating project on blockchain..."
        );


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


        console.log(
            "Blockchain transaction confirmed"
        );


        // ====================================================
        // FIND ProjectCreated EVENT
        // ====================================================

        let blockchainProjectId = null;


        console.log(
            "Number of blockchain logs:",
            receipt.logs.length
        );


        for (const log of receipt.logs) {

            try {

                if (
                    !log.address ||
                    !contract.target
                ) {
                    continue;
                }


                if (
                    log.address.toLowerCase() !==
                    contract.target.toLowerCase()
                ) {
                    continue;
                }


                const parsedLog =
                    contract.interface.parseLog({
                        topics: log.topics,
                        data: log.data
                    });


                if (
                    parsedLog &&
                    parsedLog.name ===
                    "ProjectCreated"
                ) {

                    blockchainProjectId =
                        parsedLog.args[0].toString();


                    console.log(
                        "Blockchain Project ID:",
                        blockchainProjectId
                    );


                    break;
                }

            } catch (error) {

                console.log(
                    "Log parsing error:",
                    error.message
                );

            }

        }


        // ====================================================
        // VERIFY BLOCKCHAIN PROJECT ID
        // ====================================================

        if (!blockchainProjectId) {

            return res.status(500).json({

                message:
                    "ProjectCreated event was not found",

                transactionHash:
                    tx.hash,

                contractAddress:
                    contract.target,

                logsFound:
                    receipt.logs.length
            });

        }


        // ====================================================
        // SAVE PROJECT IN MONGODB
        // ====================================================

        const project =
            new Project({

                projectId,

                name,

                description,

                village,

                district,

                officer,

                allocatedAmount: 0,

                releasedAmount: 0,

                spentAmount: 0,

                status: "PLANNED",

                blockchainProjectId:
                    blockchainProjectId.toString(),

                blockchainTransactionHash:
                    tx.hash,

                blockchainStatus:
                    "CONFIRMED"
            });


        const savedProject =
            await project.save();


        // ====================================================
        // RESPONSE
        // ====================================================

        return res.status(201).json({

            message:
                "Project created successfully",

            blockchain: {

                projectId:
                    blockchainProjectId,

                transactionHash:
                    tx.hash,

                blockNumber:
                    receipt.blockNumber
            },

            project:
                savedProject
        });


    } catch (error) {

        console.error(
            "Project creation failed:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to create project",

            error:
                error.message
        });

    }

};


// ============================================================
// GET ALL PROJECTS
// GET /api/projects
// ============================================================

const getProjects = async (req, res) => {

    try {

        const projects =
            await Project.find()
                .sort({
                    createdAt: -1
                });


        return res.json(projects);


    } catch (error) {

        console.error(
            "Fetch projects failed:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to fetch projects",

            error:
                error.message
        });

    }

};


// ============================================================
// GET SINGLE PROJECT
// GET /api/projects/:projectId
// ============================================================

const getProject = async (req, res) => {

    try {

        const {
            projectId
        } = req.params;


        const project =
            await Project.findOne({
                projectId
            });


        if (!project) {

            return res.status(404).json({

                message:
                    "Project not found"
            });

        }


        // ====================================================
        // ADMIN
        // ====================================================

        if (req.user.role === "ADMIN") {

            return res.json(project);

        }


        // ====================================================
        // OFFICER
        // ====================================================

        if (req.user.role === "OFFICER") {

            const loggedInOfficer =
                String(
                    req.user.username || ""
                )
                .trim()
                .toLowerCase();


            const assignedOfficer =
                String(
                    project.officer || ""
                )
                .trim()
                .toLowerCase();


            if (
                !assignedOfficer ||
                assignedOfficer !== loggedInOfficer
            ) {

                return res.status(403).json({

                    message:
                        "You are not assigned to this project."
                });

            }


            return res.json(project);

        }


        // ====================================================
        // CITIZEN
        // ====================================================

        if (req.user.role === "CITIZEN") {

            return res.json(project);

        }


        // ====================================================
        // UNKNOWN ROLE
        // ====================================================

        return res.status(403).json({

            message:
                "You are not authorized to view this project."
        });


    } catch (error) {

        console.error(
            "Fetch project failed:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to fetch project",

            error:
                error.message
        });

    }

};


// ============================================================
// ASSIGN / CHANGE PROJECT OFFICER
// PUT /api/projects/:projectId/assign
// ============================================================

const assignOfficer = async (req, res) => {

    try {

        const {
            projectId
        } = req.params;


        const body =
            req.body || {};


        const officer =
            String(
                body.officer || ""
            ).trim();


        // ====================================================
        // VALIDATE OFFICER
        // ====================================================

        if (!officer) {

            return res.status(400).json({

                message:
                    "Officer is required"
            });

        }


        // ====================================================
        // FIND PROJECT
        // ====================================================

        const project =
            await Project.findOne({
                projectId
            });


        if (!project) {

            return res.status(404).json({

                message:
                    "Project not found"
            });

        }


        // ====================================================
        // SAVE OLD OFFICER
        // ====================================================

        const previousOfficer =
            project.officer || null;


        // ====================================================
        // ASSIGN NEW OFFICER
        // ====================================================

        project.officer =
            officer;


        await project.save();


        // ====================================================
        // RESPONSE
        // ====================================================

        return res.json({

            message:
                `Project ${projectId} assigned to ${officer} successfully`,

            project: {

                projectId:
                    project.projectId,

                name:
                    project.name,

                officer:
                    project.officer,

                previousOfficer:
                    previousOfficer,

                status:
                    project.status
            }

        });


    } catch (error) {

        console.error(
            "Officer assignment failed:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to assign officer",

            error:
                error.message
        });

    }

};


// ============================================================
// ALLOCATE FUNDS
// POST /api/projects/:projectId/allocate
// ============================================================

const allocateFunds = async (req, res) => {

    try {

        const {
            projectId
        } = req.params;


        const allocationAmount =
            Number(req.body.amount);


        // ====================================================
        // VALIDATION
        // ====================================================

        if (
            !Number.isFinite(
                allocationAmount
            ) ||
            allocationAmount <= 0
        ) {

            return res.status(400).json({

                message:
                    "Allocation amount must be greater than 0"
            });

        }


        // ====================================================
        // FIND PROJECT
        // ====================================================

        const project =
            await Project.findOne({
                projectId
            });


        if (!project) {

            return res.status(404).json({

                message:
                    "Project not found"
            });

        }


        if (
            !project.blockchainProjectId
        ) {

            return res.status(400).json({

                message:
                    "Blockchain project ID not found"
            });

        }


        // ====================================================
        // BLOCKCHAIN
        // ====================================================

        console.log(
            "Allocating funds on blockchain..."
        );


        const tx =
            await contract.allocateFund(
                project.blockchainProjectId,
                allocationAmount
            );


        console.log(
            "Allocation transaction:",
            tx.hash
        );


        const receipt =
            await tx.wait();


        // ====================================================
        // UPDATE MONGODB
        // ====================================================

        project.allocatedAmount =
            Number(
                project.allocatedAmount || 0
            ) +
            allocationAmount;


        await project.save();


        // ====================================================
        // RESPONSE
        // ====================================================

        return res.json({

            message:
                "Funds allocated successfully",

            blockchain: {

                projectId:
                    project.blockchainProjectId,

                transactionHash:
                    tx.hash,

                blockNumber:
                    receipt.blockNumber
            },

            project
        });


    } catch (error) {

        console.error(
            "Fund allocation failed:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to allocate funds",

            error:
                error.message
        });

    }

};


// ============================================================
// RELEASE FUNDS
// POST /api/projects/:projectId/release
// ============================================================

const releaseFunds = async (req, res) => {

    try {

        const {
            projectId
        } = req.params;


        const releaseAmount =
            Number(req.body.amount);


        // ====================================================
        // VALIDATION
        // ====================================================

        if (
            !Number.isFinite(
                releaseAmount
            ) ||
            releaseAmount <= 0
        ) {

            return res.status(400).json({

                message:
                    "Release amount must be greater than 0"
            });

        }


        // ====================================================
        // FIND PROJECT
        // ====================================================

        const project =
            await Project.findOne({
                projectId
            });


        if (!project) {

            return res.status(404).json({

                message:
                    "Project not found"
            });

        }


        if (
            !project.blockchainProjectId
        ) {

            return res.status(400).json({

                message:
                    "Blockchain project ID not found"
            });

        }


        // ====================================================
        // CHECK AVAILABLE ALLOCATION
        // ====================================================

        const allocated =
            Number(
                project.allocatedAmount || 0
            );


        const released =
            Number(
                project.releasedAmount || 0
            );


        const remainingAmount =
            allocated -
            released;


        if (
            releaseAmount >
            remainingAmount
        ) {

            return res.status(400).json({

                message:
                    "Release amount exceeds remaining allocated funds",

                remainingAmount
            });

        }


        // ====================================================
        // BLOCKCHAIN
        // ====================================================

        console.log(
            "Releasing funds on blockchain..."
        );


        const tx =
            await contract.releaseFund(
                project.blockchainProjectId,
                releaseAmount
            );


        console.log(
            "Release transaction:",
            tx.hash
        );


        const receipt =
            await tx.wait();


        // ====================================================
        // UPDATE MONGODB
        // ====================================================

        project.releasedAmount =
            released +
            releaseAmount;


        if (
            project.releasedAmount > 0 &&
            project.status !==
            "COMPLETED"
        ) {

            project.status =
                "IN_PROGRESS";

        }


        await project.save();


        // ====================================================
        // RESPONSE
        // ====================================================

        return res.json({

            message:
                "Funds released successfully",

            blockchain: {

                projectId:
                    project.blockchainProjectId,

                transactionHash:
                    tx.hash,

                blockNumber:
                    receipt.blockNumber
            },

            project,

            remainingAllocatedAmount:
                allocated -
                project.releasedAmount
        });


    } catch (error) {

        console.error(
            "Fund release failed:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to release funds",

            error:
                error.message
        });

    }

};


// ============================================================
// COMPLETE PROJECT
// POST /api/projects/:projectId/complete
// ============================================================

const completeProject = async (req, res) => {

    try {

        const {
            projectId
        } = req.params;


        // ====================================================
        // FIND PROJECT
        // ====================================================

        const project =
            await Project.findOne({
                projectId
            });


        if (!project) {

            return res.status(404).json({

                message:
                    "Project not found"
            });

        }


        if (
            !project.blockchainProjectId
        ) {

            return res.status(400).json({

                message:
                    "Blockchain project ID not found"
            });

        }


        // ====================================================
        // BLOCKCHAIN
        // ====================================================

        const tx =
            await contract.completeProject(
                project.blockchainProjectId
            );


        console.log(
            "Complete project transaction:",
            tx.hash
        );


        const receipt =
            await tx.wait();


        // ====================================================
        // UPDATE MONGODB
        // ====================================================

        project.status =
            "COMPLETED";


        await project.save();


        // ====================================================
        // RESPONSE
        // ====================================================

        return res.json({

            message:
                "Project completed successfully",

            blockchain: {

                projectId:
                    project.blockchainProjectId,

                transactionHash:
                    tx.hash,

                blockNumber:
                    receipt.blockNumber
            },

            project
        });


    } catch (error) {

        console.error(
            "Project completion failed:",
            error
        );


        return res.status(500).json({

            message:
                "Failed to complete project",

            error:
                error.message
        });

    }

};


// ============================================================
// EXPORT
// ============================================================

module.exports = {

    createProject,
    getProjects,
    getProject,
    assignOfficer,
    allocateFunds,
    releaseFunds,
    completeProject

};