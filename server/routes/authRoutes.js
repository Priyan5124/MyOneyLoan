const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const router = express.Router();


// ==========================================
// TEMPORARY OTP STORAGE
// ==========================================

const otpStore = new Map();


// ==========================================
// SEND OTP
// ==========================================

router.post("/send-otp", async (req, res) => {
    try {

        const { phone } = req.body;

        if (!phone || !/^[6-9]\d{9}$/.test(phone)) {

            return res.status(400).json({
                success: false,
                message: "Enter a valid 10-digit mobile number.",
            });

        }

        const otp =
            Math.floor(
                100000 + Math.random() * 900000
            ).toString();

        const expiresAt =
            Date.now() + 5 * 60 * 1000;

        otpStore.set(phone, {
            otp,
            expiresAt,
            verified: false,
        });

        // OTP is returned to frontend.
        // Frontend can show it using alert().
        return res.json({
            success: true,
            message: "OTP generated successfully.",
            otp,
        });

    } catch (error) {

        console.error(
            "Send OTP error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to generate OTP.",
        });
    }
});


// ==========================================
// VERIFY OTP
// ==========================================

router.post("/verify-otp", async (req, res) => {

    try {

        const {
            phone,
            otp,
        } = req.body;

        if (!phone || !otp) {

            return res.status(400).json({
                success: false,
                message: "Phone number and OTP are required.",
            });

        }

        const otpData =
            otpStore.get(phone);

        if (!otpData) {

            return res.status(400).json({
                success: false,
                message: "OTP not found. Please request a new OTP.",
            });

        }

        // ======================================
        // CHECK EXPIRY
        // ======================================

        if (
            Date.now() >
            otpData.expiresAt
        ) {

            otpStore.delete(phone);

            return res.status(400).json({
                success: false,
                message: "OTP expired. Please request a new OTP.",
            });

        }

        // ======================================
        // CHECK OTP
        // ======================================

        if (
            otpData.otp !==
            otp.toString()
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid OTP.",
            });

        }

        // ======================================
        // MARK VERIFIED
        // ======================================

        otpStore.set(phone, {
            ...otpData,
            verified: true,
        });

        return res.json({
            success: true,
            message: "Mobile number verified successfully.",
        });

    } catch (error) {

        console.error(
            "Verify OTP error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "OTP verification failed.",
        });
    }

});


// ==========================================
// REGISTER
// ==========================================

router.post("/register", async (req, res) => {

    try {

        const {
            fullName,
            email,
            phone,
            password,
        } = req.body;

        // ======================================
        // VALIDATION
        // ======================================

        if (
            !fullName ||
            !email ||
            !phone ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message: "Please fill all required fields.",
            });

        }

        // ======================================
        // CHECK OTP VERIFICATION
        // ======================================

        const otpData =
            otpStore.get(phone);

        if (
            !otpData ||
            !otpData.verified
        ) {

            return res.status(400).json({
                success: false,
                message: "Please verify your mobile number first.",
            });

        }

        // ======================================
        // CHECK OTP EXPIRY
        // ======================================

        if (
            Date.now() >
            otpData.expiresAt
        ) {

            otpStore.delete(phone);

            return res.status(400).json({
                success: false,
                message: "OTP verification expired. Please verify again.",
            });

        }

        // ======================================
        // CHECK EXISTING USER
        // ======================================

        const existingUser =
            await User.findOne({
                $or: [
                    {
                        email:
                            email.toLowerCase(),
                    },
                    {
                        phone:
                            phone,
                    },
                ],
            });

        if (existingUser) {

            return res.status(409).json({
                success: false,
                message:
                    "Email or mobile number is already registered.",
            });

        }

        // ======================================
        // HASH PASSWORD
        // ======================================

        const hashedPassword =
            await bcrypt.hash(
                password,
                12
            );

        // ======================================
        // CREATE USER
        // ======================================

        const user =
            await User.create({

                fullName,

                email:
                    email.toLowerCase(),

                phone,

                password:
                    hashedPassword,

                phoneVerified:
                    true,

            });

        // ======================================
        // CREATE JWT
        // ======================================

        const token =
            jwt.sign(

                {
                    userId:
                        user._id,

                    phone:
                        user.phone,
                },

                process.env.JWT_SECRET,

                {
                    expiresIn:
                        "7d",
                }
            );

        // OTP no longer needed
        otpStore.delete(phone);

        // ======================================
        // RESPONSE
        // ======================================

        return res.status(201).json({

            success: true,

            message:
                "Registration successful.",

            token,

            user: {

                id:
                    user._id,

                fullName:
                    user.fullName,

                email:
                    user.email,

                phone:
                    user.phone,

            },

        });

    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Registration failed.",

        });

    }

});


// ==========================================
// LOGIN
// ==========================================

router.post("/login", async (req, res) => {

    try {

        const {
            emailOrPhone,
            password,
        } = req.body;

        // ======================================
        // VALIDATION
        // ======================================

        if (
            !emailOrPhone ||
            !password
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Email/phone and password are required.",

            });

        }

        // ======================================
        // FIND USER
        // ======================================

        const user =
            await User.findOne({

                $or: [

                    {
                        email:
                            emailOrPhone.toLowerCase(),
                    },

                    {
                        phone:
                            emailOrPhone,
                    },

                ],

            });

        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid login credentials.",

            });

        }

        // ======================================
        // PASSWORD CHECK
        // ======================================

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!passwordMatch) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid login credentials.",

            });

        }

        // ======================================
        // CREATE JWT
        // ======================================

        const token =
            jwt.sign(

                {
                    userId:
                        user._id,

                    phone:
                        user.phone,
                },

                process.env.JWT_SECRET,

                {
                    expiresIn:
                        "7d",
                }

            );

        // ======================================
        // RESPONSE
        // ======================================

        return res.json({

            success: true,

            message:
                "Login successful.",

            token,

            user: {

                id:
                    user._id,

                fullName:
                    user.fullName,

                email:
                    user.email,

                phone:
                    user.phone,

            },

        });

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Login failed.",

        });

    }

});


module.exports = router;