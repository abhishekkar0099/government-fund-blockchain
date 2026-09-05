const express = require("express");
const crypto = require("crypto");
const { ethers } = require("ethers");

const Project = require("../models/Project");
const Expense = require("../models/Expense");

const { contract } = require("../blockchain");

const {
    requireAuth,
    requireRole
} = require("../middleware/authMiddleware");

const upload = require("../middleware/upload");
const cloudinary = require("../config/cloudinary");

const router = express.Router();


// ============================================================
// CREATE PROJECT
// POST /api/projects
// ADMIN ONLY
// ============================================================

router.post(
    "/",
    requireAuth,
    requireRole("ADMIN"),
    async (req, res) => {

        try {

            const {
                projectId,
                name,
                description,
                village,
                district,
                officer
            } = req.body || {};

            if (!projectId || !name) {
                return res.status(400).json({
                    message: "projectId and name are required"
                });
            }


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
    }
);


// ============================================================
// GET ALL PROJECTS
// GET /api/projects
// AUTHENTICATED USERS
// ============================================================

router.get(
    "/",
    requireAuth,
    async (req, res) => {

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
    }
);

// ============================================================
// GET EXPENSE DETAILS
// GET /api/projects/:projectId/expenses
// ADMIN + ASSIGNED OFFICER ONLY
// ============================================================

router.get(
    "/:projectId/expenses",
    requireAuth,
    async (req, res) => {

        try {

            const { projectId } = req.params;

            // =========================================
            // FIND PROJECT
            // =========================================

            const project = await Project.findOne({
                projectId
            });

            if (!project) {
                return res.status(404).json({
                    message: "Project not found"
                });
            }

            // =========================================
            // ADMIN
            // =========================================

            if (req.user.role === "ADMIN") {

                // Admin can view all project expenses

            }

            // =========================================
            // OFFICER
            // =========================================

            else if (req.user.role === "OFFICER") {

                const loggedInOfficer =
                    String(req.user.username || "")
                        .trim()
                        .toLowerCase();

                const assignedOfficer =
                    String(project.officer || "")
                        .trim()
                        .toLowerCase();

                // Officer can only view expenses
                // of their assigned project

                if (
                    !assignedOfficer ||
                    assignedOfficer !== loggedInOfficer
                ) {

                    return res.status(403).json({
                        message:
                            "You are not assigned to this project."
                    });

                }

            }

            // =========================================
            // CITIZEN
            // =========================================

            else {

                return res.status(403).json({
                    message:
                        "Expense history is restricted to administrators and assigned officers."
                });

            }

            // =========================================
            // GET EXPENSES
            // =========================================

            console.log(
                "Loading protected expense history:",
                projectId
            );

            const expenses =
                await Expense.find({
                    projectId
                }).sort({
                    createdAt: -1
                });

            // =========================================
            // TOTAL EXPENSE
            // =========================================

            const totalExpense =
                expenses.reduce(
                    (total, expense) => {

                        return (
                            total +
                            Number(
                                expense.amount || 0
                            )
                        );

                    },
                    0
                );

            // =========================================
            // RESPONSE
            // =========================================

            return res.json({

                projectId,

                expenseCount:
                    expenses.length,

                totalExpense,

                expenses

            });

        } catch (error) {

            console.error(
                "Protected expense history error:",
                error
            );

            return res.status(500).json({

                message:
                    "Failed to load expense history",

                error:
                    error.message

            });

        }

    }
);


// ============================================================
// GET BLOCKCHAIN TRANSACTION HISTORY
// GET /api/projects/:projectId/transactions
// AUTHENTICATED USERS
// ============================================================

router.get(
    "/:projectId/transactions",
    requireAuth,
    async (req, res) => {

        try {

            const {
                projectId
            } = req.params;


            console.log(
                "========== BLOCKCHAIN HISTORY =========="
            );


            console.log(
                "Project ID:",
                projectId
            );


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
                project.blockchainProjectId ===
                    undefined ||
                project.blockchainProjectId ===
                    null
            ) {

                return res.status(400).json({
                    message:
                        "Blockchain project ID not found"
                });
            }


            const blockchainProjectId =
                project.blockchainProjectId;


            console.log(
                "Blockchain Project ID:",
                blockchainProjectId
            );


            const count =
                await contract.getTransactionCount(
                    blockchainProjectId
                );


            const transactionCount =
                Number(count);


            console.log(
                "Transaction Count:",
                transactionCount
            );


            const transactions = [];


            for (
                let i = 0;
                i < transactionCount;
                i++
            ) {

                const transaction =
                    await contract.getTransaction(
                        blockchainProjectId,
                        i
                    );


                transactions.push({

                    index: i,

                    projectId:
                        transaction.projectId
                            ?.toString(),

                    transactionType:
                        transaction.transactionType,

                    amount:
                        transaction.amount
                            ?.toString(),

                    performedBy:
                        transaction.performedBy,

                    timestamp:
                        transaction.timestamp
                            ?.toString()
                });
            }


            console.log(
                "Transactions returned:",
                transactions.length
            );


            console.log(
                "========== BLOCKCHAIN HISTORY END =========="
            );


            return res.json({

                blockchainProjectId:
                    blockchainProjectId.toString(),

                transactionCount:
                    transactions.length,

                transactions
            });


        } catch (error) {

            console.error(
                "Blockchain transaction history error:",
                error
            );


            return res.status(500).json({

                message:
                    "Failed to fetch blockchain transaction history",

                error:
                    error.message
            });
        }
    }
);


// ============================================================
// GET SINGLE PROJECT
// GET /api/projects/:projectId
// AUTHENTICATED USERS
// ============================================================

router.get(
    "/:projectId",
    requireAuth,
    async (req, res) => {

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
            
            // =========================================
            // VERIFY PROJECT ACCESS
            // =========================================

            // ADMIN can view every project
            if (req.user.role === "ADMIN") {
                return res.json(project);
            }

            // OFFICER can only view assigned projects
            if (req.user.role === "OFFICER") {

                const loggedInOfficer =
                    String(req.user.username || "")
                        .trim()
                        .toLowerCase();

                const assignedOfficer =
                    String(project.officer || "")
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

            // CITIZEN can view project
            if (req.user.role === "CITIZEN") {
                return res.json(project);
            }

            // Unknown role
            return res.status(403).json({
                message: "You are not authorized to view this project."
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
    }
);

// ============================================================
// ASSIGN / CHANGE PROJECT OFFICER
// PUT /api/projects/:projectId/assign
// ADMIN ONLY
// ============================================================

router.put(
    "/:projectId/assign",
    requireAuth,
    requireRole("ADMIN"),
    async (req, res) => {

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


            // =====================================================
            // VALIDATE OFFICER
            // =====================================================

            if (!officer) {

                return res.status(400).json({
                    message:
                        "Officer is required"
                });

            }


            // =====================================================
            // FIND EXISTING PROJECT
            // =====================================================

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


            // =====================================================
            // SAVE OLD OFFICER
            // =====================================================

            const previousOfficer =
                project.officer || null;


            // =====================================================
            // ASSIGN NEW OFFICER
            // =====================================================

            project.officer =
                officer;


            await project.save();


            // =====================================================
            // RESPONSE
            // =====================================================

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

    }
);


// ============================================================
// ALLOCATE FUNDS
// POST /api/projects/:projectId/allocate
// ADMIN ONLY
// ============================================================

router.post(
    "/:projectId/allocate",
    requireAuth,
    requireRole("ADMIN"),
    async (req, res) => {

        try {

            const {
                projectId
            } = req.params;


            const allocationAmount =
                Number(req.body.amount);


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


            // =================================================
            // BLOCKCHAIN
            // =================================================

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


            // =================================================
            // MONGODB
            // =================================================

            project.allocatedAmount =
                Number(
                    project.allocatedAmount || 0
                ) +
                allocationAmount;


            await project.save();


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
    }
);


// ============================================================
// RELEASE FUNDS
// POST /api/projects/:projectId/release
// ADMIN ONLY
// ============================================================

router.post(
    "/:projectId/release",
    requireAuth,
    requireRole("ADMIN"),
    async (req, res) => {

        try {

            const {
                projectId
            } = req.params;


            const releaseAmount =
                Number(req.body.amount);


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


            // =================================================
            // CHECK AVAILABLE ALLOCATION
            // =================================================

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


            // =================================================
            // BLOCKCHAIN
            // =================================================

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


            // =================================================
            // MONGODB
            // =================================================

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
    }
);

// ============================================================
// RECORD EXPENSE WITH EVIDENCE
// POST /api/projects/:projectId/expense
// OFFICER ONLY
// ============================================================

router.post(
    "/:projectId/expense",
    requireAuth,
    requireRole("OFFICER"),
    upload.array("evidence", 5),
    async (req, res) => {

        try {

            const {
                projectId
            } = req.params;

            const body = req.body || {};

            const category =
                body.category;

            const description =
                body.description;

            const amount =
                body.amount;

            const paidTo =
                body.paidTo || "";

            const expenseAmount =
                Number(
                    String(amount || "").trim()
                );

            console.log(
                "========== EXPENSE DEBUG =========="
            );

            console.log(
                "req.body:",
                req.body
            );

            console.log(
                "category:",
                category
            );

            console.log(
                "description:",
                description
            );

            console.log(
                "amount:",
                amount
            );

            console.log(
                "expenseAmount:",
                expenseAmount
            );

            console.log(
                "files:",
                req.files
                    ? req.files.map(
                        file => file.originalname
                    )
                    : []
            );

            console.log(
                "===================================="
            );


            // =====================================================
            // VALIDATION
            // =====================================================

            if (
                !category ||
                !category.trim()
            ) {

                return res.status(400).json({
                    message:
                        "Expense category is required"
                });

            }


            if (
                !description ||
                !description.trim()
            ) {

                return res.status(400).json({
                    message:
                        "Expense description is required"
                });

            }


            if (
                !Number.isFinite(
                    expenseAmount
                ) ||
                expenseAmount <= 0
            ) {

                return res.status(400).json({
                    message:
                        "Expense amount must be greater than 0"
                });

            }


            // =====================================================
            // FIND PROJECT
            // =====================================================

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


            // =====================================================
            // CHECK BLOCKCHAIN PROJECT ID
            // =====================================================

            if (
                !project.blockchainProjectId
            ) {

                return res.status(400).json({
                    message:
                        "Blockchain project ID not found"
                });

            }


            // =====================================================
            // CHECK AVAILABLE FUNDS
            // =====================================================

            const released =
                Number(
                    project.releasedAmount || 0
                );

            const spent =
                Number(
                    project.spentAmount || 0
                );

            const availableAmount =
                released - spent;


            if (
                expenseAmount >
                availableAmount
            ) {

                return res.status(400).json({

                    message:
                        "Expense exceeds available released funds",

                    availableAmount

                });

            }


            // =====================================================
            // GENERATE EXPENSE ID
            // =====================================================

            const expenseId =
                new Expense()._id.toString();

// =====================================================
// GENERATE EVIDENCE HASH
// =====================================================

let evidenceHash = null;

const evidence = [];

const individualHashes = [];


// =====================================================
// PROCESS UPLOADED EVIDENCE
// =====================================================

if (
    req.files &&
    req.files.length > 0
) {

    for (
        const file of req.files
    ) {

        // ==========================================
        // CREATE SHA-256 HASH OF IMAGE
        // ==========================================

        const fileHash =
            crypto
                .createHash("sha256")
                .update(file.buffer)
                .digest("hex");


        individualHashes.push(
            fileHash
        );


        // ==========================================
        // UPLOAD IMAGE TO CLOUDINARY
        // ==========================================

        const uploadedImage =
            await new Promise(
                (resolve, reject) => {

                    const stream =
                        cloudinary
                            .uploader
                            .upload_stream(
                                {
                                    folder:
                                        "government-fund/expenses",

                                    resource_type:
                                        "image"
                                },

                                (
                                    error,
                                    result
                                ) => {

                                    if (error) {

                                        reject(
                                            error
                                        );

                                    } else {

                                        resolve(
                                            result
                                        );

                                    }

                                }
                            );


                    stream.end(
                        file.buffer
                    );

                }
            );


        // ==========================================
        // CHECK CLOUDINARY URL
        // ==========================================

        if (
            !uploadedImage ||
            !uploadedImage.secure_url
        ) {

            throw new Error(
                "Image upload failed"
            );

        }


        // ==========================================
        // SAVE EVIDENCE INFORMATION
        // ==========================================

        evidence.push({

            url:
                uploadedImage.secure_url,

            publicId:
                uploadedImage.public_id,

            filename:
                file.originalname,

            type:
                file.mimetype,

            size:
                file.size,

            hash:
                fileHash,

            uploadedAt:
                new Date()

        });


        console.log(
            "======================================"
        );

        console.log(
            "IMAGE UPLOADED SUCCESSFULLY"
        );

        console.log(
            "Filename:",
            file.originalname
        );

        console.log(
            "URL:",
            uploadedImage.secure_url
        );

        console.log(
            "Public ID:",
            uploadedImage.public_id
        );

        console.log(
            "SHA-256:",
            fileHash
        );

        console.log(
            "======================================"
        );

    }


    // =================================================
    // CREATE ONE COMBINED EVIDENCE HASH
    // =================================================

    const combinedHashes =
        individualHashes
            .sort()
            .join("|");


    evidenceHash =
        crypto
            .createHash("sha256")
            .update(
                combinedHashes
            )
            .digest("hex");


    console.log(
        "Combined Evidence Hash:",
        evidenceHash
    );


} else {

    console.log(
        "No evidence uploaded"
    );

}



            // =====================================================
            // CREATE EXPENSE
            // =====================================================

            const expense =
                new Expense({

                    _id:
                        expenseId,

                    projectId,

                    category:
                        category.trim(),

                    description:
                        description.trim(),

                    amount:
                        expenseAmount,

                    paidTo:
                        paidTo.trim(),

                    recordedBy:
                        req.user.username,

                    evidence

                });


            await expense.validate();


            // =====================================================
            // BLOCKCHAIN
            // =====================================================

            console.log(
                "======================================"
            );

            console.log(
                "Recording expense on blockchain..."
            );

            console.log(
                "Blockchain Project ID:",
                project.blockchainProjectId
            );

            console.log(
                "Expense ID:",
                expenseId
            );

            console.log(
                "Amount:",
                expenseAmount
            );

            console.log(
                "Evidence Hash:",
                evidenceHash
            );

            console.log(
                "======================================"
            );


            /*
             * If there is no evidence,
             * use ethers.ZeroHash.
             */

            const blockchainEvidenceHash =
                evidenceHash
                    ? `0x${evidenceHash}`
                    : ethers.ZeroHash;


            const tx =
                await contract.recordExpense(

                    project.blockchainProjectId,

                    expenseId,

                    expenseAmount,

                    blockchainEvidenceHash

                );


            console.log(
                "Expense transaction:",
                tx.hash
            );


            const receipt =
                await tx.wait();


            console.log(
                "Expense blockchain block:",
                receipt.blockNumber
            );


            // =====================================================
            // SAVE BLOCKCHAIN INFORMATION TO EXPENSE
            // =====================================================

            expense.blockchainTransactionHash =
                tx.hash;


            expense.blockchainEvidenceHash =
                blockchainEvidenceHash;


            // =====================================================
            // SAVE EXPENSE
            // =====================================================

            const savedExpense =
                await expense.save();


            // =====================================================
            // UPDATE PROJECT
            // =====================================================

            project.spentAmount =
                spent +
                expenseAmount;


            await project.save();


            // =====================================================
            // RESPONSE
            // =====================================================

            return res.status(201).json({

                message:
                    "Expense recorded successfully",

                blockchain: {

                    projectId:
                        project.blockchainProjectId,

                    expenseId:
                        expenseId,

                    transactionHash:
                        tx.hash,

                    blockNumber:
                        receipt.blockNumber,

                    evidenceHash:
                        blockchainEvidenceHash

                },

                expense:
                    savedExpense,

                project: {

                    projectId:
                        project.projectId,

                    blockchainProjectId:
                        project.blockchainProjectId,

                    allocatedAmount:
                        project.allocatedAmount,

                    releasedAmount:
                        project.releasedAmount,

                    spentAmount:
                        project.spentAmount,

                    availableAmount:
                        Number(
                            project.releasedAmount || 0
                        ) -
                        Number(
                            project.spentAmount || 0
                        )

                }

            });


        } catch (error) {

            console.error(
                "Expense recording failed:",
                error
            );


            return res.status(500).json({

                message:
                    "Failed to record expense",

                error:
                    error.message

            });

        }

    }
);

// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;