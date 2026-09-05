// services/documentHashService.js

const crypto = require("crypto");

/**
 * Generate SHA-256 hash for a file buffer.
 *
 * @param {Buffer} fileBuffer
 * @returns {string} SHA-256 hash in hexadecimal format
 */
function generateFileHash(fileBuffer) {
    if (!fileBuffer) {
        throw new Error("File buffer is required");
    }

    return crypto
        .createHash("sha256")
        .update(fileBuffer)
        .digest("hex");
}

/**
 * Generate SHA-256 hash for a string.
 *
 * @param {string} value
 * @returns {string} SHA-256 hash
 */
function generateTextHash(value) {
    if (value === undefined || value === null) {
        throw new Error("Value is required");
    }

    return crypto
        .createHash("sha256")
        .update(String(value), "utf8")
        .digest("hex");
}

/**
 * Generate a combined hash from multiple evidence files.
 *
 * The individual file hashes are sorted before combining them.
 * This gives the expense one deterministic evidence hash.
 *
 * @param {Array} files
 * @returns {Object}
 */
function generateEvidenceHash(files = []) {
    if (!Array.isArray(files) || files.length === 0) {
        return {
            evidenceHash: null,
            fileHashes: []
        };
    }

    const fileHashes = files.map((file) => {
        if (!file.buffer) {
            throw new Error(
                `Unable to hash file: ${file.originalname || "unknown file"}`
            );
        }

        return {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            hash: generateFileHash(file.buffer)
        };
    });

    // Sort hashes so the final result is deterministic
    const sortedHashes = fileHashes
        .map((file) => file.hash)
        .sort();

    const combinedValue = sortedHashes.join("|");

    const evidenceHash = generateTextHash(combinedValue);

    return {
        evidenceHash,
        fileHashes
    };
}

/**
 * Convert a hexadecimal SHA-256 hash to bytes32-compatible value
 * for Solidity.
 *
 * @param {string} hash
 * @returns {string}
 */
function hashToBytes32(hash) {
    if (!hash) {
        throw new Error("Hash is required");
    }

    const cleanHash = hash.replace(/^0x/, "");

    if (!/^[0-9a-fA-F]{64}$/.test(cleanHash)) {
        throw new Error(
            "Hash must contain exactly 64 hexadecimal characters"
        );
    }

    return `0x${cleanHash}`;
}

module.exports = {
    generateFileHash,
    generateTextHash,
    generateEvidenceHash,
    hashToBytes32
};