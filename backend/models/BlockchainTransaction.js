const mongoose = require("mongoose");

const blockchainTransactionSchema =
    new mongoose.Schema(
        {
            projectId: {
                type: String,
                required: true,
                index: true
            },

            blockchainProjectId: {
                type: String,
                required: true
            },

            transactionType: {
                type: String,
                required: true
            },

            amount: {
                type: Number,
                default: 0
            },

            transactionHash: {
                type: String,
                required: true,
                unique: true
            },

            blockNumber: {
                type: Number,
                default: null
            },

            performedBy: {
                type: String,
                default: ""
            },

            timestamp: {
                type: Date,
                default: Date.now
            }
        },
        {
            timestamps: true
        }
    );

module.exports =
    mongoose.model(
        "BlockchainTransaction",
        blockchainTransactionSchema
    );