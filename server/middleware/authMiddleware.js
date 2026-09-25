const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {

        const authHeader = req.headers.authorization;

        // ==========================================
        // CHECK AUTHORIZATION HEADER
        // ==========================================

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        // ==========================================
        // GET TOKEN
        // ==========================================

        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format.",
            });
        }

        const token = authHeader.substring(7).trim();

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication token is missing.",
            });
        }

        // ==========================================
        // VERIFY TOKEN
        // ==========================================

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // ==========================================
        // CHECK USER ID
        // ==========================================

        if (!decoded || !decoded.userId) {
            return res.status(401).json({
                success: false,
                message: "User ID not found in authentication token.",
            });
        }

        // ==========================================
        // STORE USER DATA
        // ==========================================

        req.user = decoded;

        next();

    } catch (error) {

        console.error(
            "Authentication middleware error:",
            error.message
        );

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token.",
        });
    }
};

module.exports = authMiddleware;