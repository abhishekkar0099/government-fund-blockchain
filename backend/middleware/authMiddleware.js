const jwt = require("jsonwebtoken");

const JWT_SECRET =
    process.env.JWT_SECRET ||
    "government-fund-secret-key";


// ==========================================
// VERIFY LOGIN
// ==========================================

const requireAuth = (
    req,
    res,
    next
) => {

    try {

        const authHeader =
            req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                message:
                    "Authentication required"
            });
        }

        const token =
            authHeader.split(" ")[1];

        const decoded =
            jwt.verify(
                token,
                JWT_SECRET
            );

        req.user = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            message:
                "Invalid or expired token"
        });
    }
};


// ==========================================
// CHECK ROLE
// ==========================================

const requireRole = (...allowedRoles) => {

    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                message:
                    "Authentication required"
            });
        }

        if (
            !allowedRoles.includes(
                req.user.role
            )
        ) {
            return res.status(403).json({
                message:
                    "You do not have permission to perform this action"
            });
        }

        next();
    };
};


module.exports = {
    requireAuth,
    requireRole
};