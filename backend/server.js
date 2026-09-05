const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const projectRoutes = require("./routes/projectRoutes");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes =require("./routes/dashboardRoutes");

const app = express();


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


// ==========================================
// ROUTES
// ==========================================

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/projects",
    projectRoutes
);

app.use(
    "/api/dashboard",
    dashboardRoutes
);

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/", (req, res) => {

    res.json({
        message:
            "Government Fund Blockchain API is running!"
    });

});


// ==========================================
// SERVER
// ==========================================

const PORT =
    process.env.PORT || 5000;


mongoose
    .connect(process.env.MONGODB_URI)

    .then(() => {

        console.log(
            "MongoDB connected successfully"
        );

        app.listen(
            PORT,
            () => {

                console.log(
                    `Server running on http://localhost:${PORT}`
                );

            }
        );

    })

    .catch((error) => {

        console.error(
            "MongoDB connection failed:"
        );

        console.error(
            error.message
        );

    });