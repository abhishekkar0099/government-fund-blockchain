const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const router = express.Router();

const JWT_SECRET =
    process.env.JWT_SECRET ||
    "government-fund-secret-key";


// ==========================================
// LOGIN
// POST /api/auth/login
// ==========================================

router.post(
    "/login",
    async (req, res) => {

        try {

            const {
                username,
                password
            } = req.body;

            if (
                !username ||
                !password
            ) {
                return res.status(400).json({
                    message:
                        "Username and password are required"
                });
            }

            const user =
                await User.findOne({
                    username:
                        username.trim()
                });

            if (!user) {
                return res.status(401).json({
                    message:
                        "Invalid username or password"
                });
            }

            const passwordMatch =
                await bcrypt.compare(
                    password,
                    user.password
                );

            if (!passwordMatch) {
                return res.status(401).json({
                    message:
                        "Invalid username or password"
                });
            }

            const token =
                jwt.sign(
                    {
                        userId:
                            user._id.toString(),

                        username:
                            user.username,

                        role:
                            user.role
                    },
                    JWT_SECRET,
                    {
                        expiresIn:
                            "8h"
                    }
                );

            return res.json({

                message:
                    "Login successful",

                token,

                user: {
                    id:
                        user._id,

                    username:
                        user.username,

                    role:
                        user.role
                }
            });

        } catch (error) {

            console.error(
                "LOGIN ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "Login failed"
            });
        }
    }
);

// ==========================================
// CITIZEN REGISTRATION
// POST /api/auth/register
// ==========================================

router.post(
    "/register",
    async (req, res) => {

        try {

            const {
                username,
                password
            } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    message:
                        "Username and password are required"
                });
            }

            if (username.trim().length < 3) {
                return res.status(400).json({
                    message:
                        "Username must contain at least 3 characters"
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    message:
                        "Password must contain at least 6 characters"
                });
            }

            const existingUser =
                await User.findOne({
                    username: username.trim()
                });

            if (existingUser) {
                return res.status(409).json({
                    message:
                        "Username already exists"
                });
            }

            const hashedPassword =
                await bcrypt.hash(
                    password,
                    10
                );

            const user =
                await User.create({
                    username:
                        username.trim(),

                    password:
                        hashedPassword,

                    role: "CITIZEN"
                });

            return res.status(201).json({
                message:
                    "Citizen account created successfully",

                user: {
                    id: user._id,
                    username: user.username,
                    role: user.role
                }
            });

        } catch (error) {

            console.error(
                "CITIZEN REGISTRATION ERROR:",
                error
            );

            return res.status(500).json({
                message:
                    "Failed to create citizen account"
            });
        }
    }
);
// ==========================================
// GET ALL OFFICERS
// GET /api/auth/officers
// ADMIN ONLY
// ==========================================

router.get(
    "/officers",
    async (req, res) => {

        try {

            // =====================================
            // GET TOKEN
            // =====================================

            const authHeader =
                req.headers.authorization;

            if (
                !authHeader ||
                !authHeader.startsWith("Bearer ")
            ) {

                return res.status(401).json({
                    message:
                        "Authorization token required"
                });

            }

            const token =
                authHeader.split(" ")[1];


            // =====================================
            // VERIFY TOKEN
            // =====================================

            let decoded;

            try {

                decoded =
                    jwt.verify(
                        token,
                        JWT_SECRET
                    );

            } catch (error) {

                return res.status(401).json({
                    message:
                        "Invalid or expired token"
                });

            }


            // =====================================
            // ADMIN ONLY
            // =====================================

            if (
                decoded.role !== "ADMIN"
            ) {

                return res.status(403).json({
                    message:
                        "Admin access required"
                });

            }


            // =====================================
            // FIND OFFICERS
            // =====================================

            const officers =
                await User.find(
                    {
                        role: "OFFICER"
                    },
                    {
                        _id: 1,
                        username: 1,
                        role: 1
                    }
                )
                .sort({
                    username: 1
                });


            // =====================================
            // RESPONSE
            // =====================================

            return res.json({

                count:
                    officers.length,

                officers

            });

        } catch (error) {

            console.error(
                "GET OFFICERS ERROR:",
                error
            );

            return res.status(500).json({

                message:
                    "Failed to load officers",

                error:
                    error.message

            });

        }

    }
);

// ==========================================
// CREATE OFFICER
// POST /api/auth/officers
// ADMIN ONLY
// ==========================================

router.post(
    "/officers",
    async (req, res) => {

        try {

            // =====================================
            // AUTHORIZATION
            // =====================================

            const authHeader =
                req.headers.authorization;

            if (
                !authHeader ||
                !authHeader.startsWith("Bearer ")
            ) {
                return res.status(401).json({
                    message:
                        "Authorization token required"
                });
            }

            const token =
                authHeader.split(" ")[1];

            let decoded;

            try {

                decoded =
                    jwt.verify(
                        token,
                        JWT_SECRET
                    );

            } catch (error) {

                return res.status(401).json({
                    message:
                        "Invalid or expired token"
                });

            }

            // =====================================
            // ADMIN ONLY
            // =====================================

            if (decoded.role !== "ADMIN") {

                return res.status(403).json({
                    message:
                        "Admin access required"
                });

            }

            // =====================================
            // INPUT
            // =====================================

            const {
                username,
                password
            } = req.body;

            if (
                !username ||
                !password
            ) {
                return res.status(400).json({
                    message:
                        "Username and password are required"
                });
            }

            const cleanUsername =
                username.trim();

            // =====================================
            // VALIDATION
            // =====================================

            if (cleanUsername.length < 3) {

                return res.status(400).json({
                    message:
                        "Username must contain at least 3 characters"
                });

            }

            if (password.length < 6) {

                return res.status(400).json({
                    message:
                        "Password must contain at least 6 characters"
                });

            }

            // =====================================
            // CHECK EXISTING USER
            // =====================================

            const existingUser =
                await User.findOne({
                    username: cleanUsername
                });

            if (existingUser) {

                return res.status(409).json({
                    message:
                        "Username already exists"
                });

            }

            // =====================================
            // HASH PASSWORD
            // =====================================

            const hashedPassword =
                await bcrypt.hash(
                    password,
                    10
                );

            // =====================================
            // CREATE OFFICER
            // =====================================

            const officer =
                await User.create({

                    username:
                        cleanUsername,

                    password:
                        hashedPassword,

                    role: "OFFICER"

                });

            // =====================================
            // RESPONSE
            // =====================================

            return res.status(201).json({

                message:
                    "Officer created successfully",

                officer: {

                    id:
                        officer._id,

                    username:
                        officer.username,

                    role:
                        officer.role

                }

            });

        } catch (error) {

            console.error(
                "CREATE OFFICER ERROR:",
                error
            );

            return res.status(500).json({

                message:
                    "Failed to create officer",

                error:
                    error.message

            });

        }

    }
);
module.exports = router;