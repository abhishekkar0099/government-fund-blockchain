const express = require("express");
const router = express.Router();

const Project = require("../models/Project");
const Expense = require("../models/Expense");

const {
    requireAuth
} = require("../middleware/authMiddleware");


// ============================================================
// DASHBOARD STATISTICS
// GET /api/dashboard/stats
// ============================================================

router.get(
    "/stats",
    requireAuth,
    async (req, res) => {

        try {

            const projects =
                await Project.find({})
                .sort({
                    updatedAt: -1
                });


            const totalProjects =
                projects.length;


            const totalAllocated =
                projects.reduce(
                    (total, project) =>
                        total +
                        Number(
                            project.allocatedAmount || 0
                        ),
                    0
                );


            const totalReleased =
                projects.reduce(
                    (total, project) =>
                        total +
                        Number(
                            project.releasedAmount || 0
                        ),
                    0
                );


            const totalSpent =
                projects.reduce(
                    (total, project) =>
                        total +
                        Number(
                            project.spentAmount || 0
                        ),
                    0
                );


            const availableFunds =
                totalReleased -
                totalSpent;


            const statusCounts = {

                PLANNED: 0,

                IN_PROGRESS: 0,

                COMPLETED: 0,

                CANCELLED: 0

            };


            projects.forEach(
                (project) => {

                    if (
                        Object.prototype.hasOwnProperty.call(
                            statusCounts,
                            project.status
                        )
                    ) {

                        statusCounts[
                            project.status
                        ]++;

                    }

                }
            );


            const recentExpenses =
                await Expense.find({})
                .sort({
                    createdAt: -1
                })
                .limit(5);


            return res.json({

                totalProjects,

                totalAllocated,

                totalReleased,

                totalSpent,

                availableFunds,

                statusCounts,

                recentExpenses

            });

        } catch (error) {

            console.error(
                "Dashboard statistics error:",
                error
            );


            return res.status(500).json({

                message:
                    "Failed to load dashboard statistics",

                error:
                    error.message

            });

        }

    }
);


module.exports = router;