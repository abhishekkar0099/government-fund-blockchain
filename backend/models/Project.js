const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
    {
        projectId: {
            type: String,
            required: true,
            unique: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            default: ""
        },

        village: {
            type: String,
            required: true
        },

        district: {
            type: String,
            required: true
        },

        allocatedAmount: {
            type: Number,
            required: true,
            min: 0
        },

        releasedAmount: {
            type: Number,
            default: 0,
            min: 0
        },

        spentAmount: {
            type: Number,
            default: 0,
            min: 0
        },

        officer: {
            type: String,
            default: ""
        },

        status: {
            type: String,
            enum: ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
            default: "PLANNED"
        },

        blockchainProjectId: {
        type: String,
        default: null
        },

        blockchainTransactionHash: {
        type: String,
        default: null
       },

        blockchainStatus: {
        type: String,
        enum: [
         "PENDING",
         "CONFIRMED",
         "FAILED"
       ],
        default: "PENDING"
    }
        
        
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Project", projectSchema);