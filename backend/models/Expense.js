const mongoose = require("mongoose");

const evidenceSchema = new mongoose.Schema(
    {
        url: {
            type: String,
            required: true
        },

        publicId: {
            type: String,
            required: true
        },

        filename: {
            type: String,
            default: ""
        },

        type: {
            type: String,
            default: ""
        },

        size: {
            type: Number,
            default: 0
        },

        hash: {
            type: String,
            required: true
        },

        uploadedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        _id: false
    }
);

const expenseSchema = new mongoose.Schema(
    {
        projectId: {
            type: String,
            required: true
        },

        category: {
            type: String,
            required: true
        },

        description: {
            type: String,
            required: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        paidTo: {
            type: String,
            default: ""
        },

        recordedBy: {
            type: String,
            default: ""
        },

        // =========================================
        // CLOUDINARY / PHOTO EVIDENCE
        // =========================================

        evidence: {
            type: [evidenceSchema],
            default: []
        },

        // =========================================
        // BLOCKCHAIN
        // =========================================

        blockchainTransactionHash: {
            type: String,
            default: null
        },

        blockchainEvidenceHash: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Expense", expenseSchema);