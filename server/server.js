const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config();

const connectDB =
    require("./config/db");

const loanRoutes =
    require("./routes/loanRoutes");

const authRoutes =
    require("./routes/authRoutes");

const adminRoutes =
    require("./routes/adminRoutes");


const app = express();


// ==========================================
// DATABASE
// ==========================================

connectDB();


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(
    cors({
        origin: "https://your-frontend.vercel.app",
        credentials: true,
    })
);

app.use(
    express.json()
);


// ==========================================
// STATIC UPLOADS
// ==========================================

app.use(
    "/uploads",
    express.static(
        path.join(
            __dirname,
            "uploads"
        )
    )
);


// ==========================================
// ROOT
// ==========================================

app.get("/", (req, res) => {

    res.json({
        message:
            "Myoney Loans Backend is running",
    });

});


// ==========================================
// ROUTES
// ==========================================

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/loans",
    loanRoutes
);

app.use(
    "/api/admin",
    adminRoutes
);


// ==========================================
// ERROR HANDLER
// ==========================================

app.use(
    (err, req, res, next) => {

        console.error(
            "Server error:",
            err
        );

        res.status(500).json({
            success: false,
            message:
                err.message ||
                "Internal server error.",
        });

    }
);


// ==========================================
// SERVER
// ==========================================

const PORT =
    process.env.PORT || 5000;


app.listen(
    PORT,
    () => {

        console.log(
            `Server running on port ${PORT}`
        );

    }
);