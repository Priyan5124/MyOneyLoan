const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const LoanApplication = require("../models/LoanApplication");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// ==========================================
// UPLOAD FOLDER
// ==========================================

const uploadDir = path.join(
    __dirname,
    "../uploads"
);

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {
        recursive: true,
    });
}


// ==========================================
// MULTER STORAGE
// ==========================================

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(
            null,
            uploadDir
        );

    },

    filename: (req, file, cb) => {

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(
                Math.random() * 1e9
            ) +
            path
                .extname(
                    file.originalname
                )
                .toLowerCase();

        cb(
            null,
            uniqueName
        );

    },

});


// ==========================================
// FILE FILTER
// ==========================================

const fileFilter = (
    req,
    file,
    cb
) => {

    const allowedTypes = [

        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf",

    ];

    if (
        allowedTypes.includes(
            file.mimetype
        )
    ) {

        cb(
            null,
            true
        );

    } else {

        cb(
            new Error(
                "Only JPG, PNG and PDF files are allowed."
            )
        );

    }

};


// ==========================================
// MULTER
// ==========================================

const upload = multer({

    storage,

    fileFilter,

    limits: {
        fileSize:
            5 * 1024 * 1024,
    },

});


// ==========================================
// CHECK 30-DAY REAPPLICATION BLOCK
// ==========================================

const checkReapplyBlock = async (
    req,
    res,
    next
) => {

    try {

        if (!req.user?.userId) {

            return res.status(401).json({

                success: false,

                message:
                    "User authentication information is missing.",

            });

        }

        const latestApplication =
            await LoanApplication.findOne({
                userId: req.user.userId,
            }).sort({
                createdAt: -1,
            });


        if (
            latestApplication &&
            latestApplication.applicationStatus ===
            "Rejected" &&
            latestApplication.reapplyBlockedUntil &&
            new Date() <
            new Date(
                latestApplication.reapplyBlockedUntil
            )
        ) {

            const blockedUntil =
                new Date(
                    latestApplication.reapplyBlockedUntil
                );


            const remainingTime =
                blockedUntil.getTime() -
                Date.now();


            const remainingDays =
                Math.ceil(
                    remainingTime /
                    (1000 *
                        60 *
                        60 *
                        24)
                );


            return res.status(403).json({

                success: false,

                blocked: true,

                message:
                    "Your application was rejected. Please try again after 30 days.",

                reapplyBlockedUntil:
                    blockedUntil,

                remainingDays:
                    remainingDays,

            });

        }


        next();

    }

    catch (error) {

        console.error(
            "Reapply block check error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to check application eligibility.",

        });

    }

};


// ==========================================
// CREATE LOAN APPLICATION
// ==========================================

router.post(

    "/apply",

    authMiddleware,

    checkReapplyBlock,

    upload.fields([

        {
            name: "aadhaarFront",
            maxCount: 1,
        },

        {
            name: "aadhaarBack",
            maxCount: 1,
        },

        {
            name: "panCard",
            maxCount: 1,
        },

        {
            name: "bankPassbook",
            maxCount: 1,
        },

        {
            name: "selfie",
            maxCount: 1,
        },

    ]),

    async (req, res) => {

        try {

            console.log(
                "Loan application received"
            );


            // ======================================
            // CHECK AUTHENTICATED USER
            // ======================================

            if (
                !req.user ||
                !req.user.userId
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "User authentication information is missing.",

                });

            }


            const userId =
                req.user.userId;


            // ======================================
            // GET FORM DATA
            // ======================================

            const {

                fullName,
                email,
                phone,

                loanType,
                amount,
                income,
                employment,

                familyPhone,

                accountNumber,
                ifscCode,

                eligibilityStatus,

                termsAccepted,

            } = req.body;


            // ======================================
            // BASIC VALIDATION
            // ======================================

            if (

                !fullName ||
                !email ||
                !phone ||
                !loanType ||
                !amount ||
                !income ||
                !employment ||
                !familyPhone ||
                !accountNumber ||
                !ifscCode

            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please fill all required fields.",

                });

            }


            // ======================================
            // TERMS
            // ======================================

            if (
                termsAccepted !== "true" &&
                termsAccepted !== true
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please accept the Terms & Conditions.",

                });

            }


            // ======================================
            // CHECK DOCUMENTS
            // ======================================

            if (

                !req.files?.aadhaarFront?.[0] ||
                !req.files?.aadhaarBack?.[0] ||
                !req.files?.panCard?.[0] ||
                !req.files?.bankPassbook?.[0] ||
                !req.files?.selfie?.[0]

            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please upload all required documents including selfie.",

                });

            }


            // ======================================
            // FILE PATHS
            // ======================================

            const aadhaarFront =
                `/uploads/${req.files.aadhaarFront[0].filename}`;

            const aadhaarBack =
                `/uploads/${req.files.aadhaarBack[0].filename}`;

            const panCard =
                `/uploads/${req.files.panCard[0].filename}`;

            const bankPassbook =
                `/uploads/${req.files.bankPassbook[0].filename}`;

            const selfie =
                `/uploads/${req.files.selfie[0].filename}`;


            // ======================================
            // CREATE APPLICATION
            // ======================================

            const application =
                new LoanApplication({

                    userId: userId,

                    fullName:
                        fullName.trim(),

                    email:
                        email
                            .trim()
                            .toLowerCase(),

                    phone:
                        phone.trim(),

                    loanType,

                    amount:
                        Number(amount),

                    income:
                        Number(income),

                    employment,

                    familyPhone:
                        familyPhone.trim(),

                    accountNumber:
                        accountNumber.trim(),

                    ifscCode:
                        ifscCode
                            .trim()
                            .toUpperCase(),

                    aadhaarFront,

                    aadhaarBack,

                    panCard,

                    bankPassbook,

                    selfie,

                    eligibilityStatus:
                        eligibilityStatus ||
                        "eligible",

                    termsAccepted:
                        termsAccepted === true ||
                        termsAccepted === "true",

                    termsAcceptedAt:
                        new Date(),

                    applicationStatus:
                        "Pending",

                    offerStatus:
                        "None",

                    loanStatus:
                        "NotStarted",

                    disbursementStatus:
                        "None",

                });


            // ======================================
            // SAVE DATABASE
            // ======================================

            const savedApplication =
                await application.save();


            // ======================================
            // SUCCESS RESPONSE
            // ======================================

            return res.status(201).json({

                success: true,

                message:
                    "Loan application submitted successfully.",

                applicationId:
                    savedApplication._id,

            });

        }

        catch (error) {

            console.error(
                "Loan application error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Failed to submit loan application.",

                error:
                    error.message,

            });

        }

    }

);


// ==========================================
// UPDATE APPLICATION STATUS
// ADMIN
// ==========================================

router.put(
    "/applications/:id/status",
    async (req, res) => {

        try {

            const { status } =
                req.body;


            // ======================================
            // VALIDATE STATUS
            // ======================================

            if (
                ![
                    "Pending",
                    "Approved",
                    "Rejected",
                ].includes(status)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid application status.",

                });

            }


            // ======================================
            // BASIC UPDATE
            // ======================================

            const updateData = {

                applicationStatus:
                    status,

            };


            // ======================================
            // APPROVED
            // ======================================
            // IMPORTANT:
            // Admin approves application
            // → User gets loan offer
            // ======================================

            if (
                status === "Approved"
            ) {

                updateData.offerStatus =
                    "PendingAcceptance";

                updateData.loanStatus =
                    "OfferPending";

                updateData.reapplyBlockedUntil =
                    null;

            }


            // ======================================
            // REJECTED
            // ======================================

            if (
                status === "Rejected"
            ) {

                updateData.reapplyBlockedUntil =
                    new Date(
                        Date.now() +
                        30 *
                        24 *
                        60 *
                        60 *
                        1000
                    );

                updateData.offerStatus =
                    "None";

                updateData.loanStatus =
                    "NotStarted";

            }


            // ======================================
            // PENDING
            // ======================================

            if (
                status === "Pending"
            ) {

                updateData.reapplyBlockedUntil =
                    null;

                updateData.offerStatus =
                    "None";

                updateData.loanStatus =
                    "NotStarted";

            }


            // ======================================
            // UPDATE DATABASE
            // ======================================

            const application =
                await LoanApplication.findByIdAndUpdate(
                    req.params.id,
                    updateData,
                    {
                        new: true,
                    }
                );


            if (!application) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Application not found.",

                });

            }


            console.log(
                "Application updated:",
                application._id,
                application.applicationStatus,
                application.offerStatus,
                application.loanStatus
            );


            return res.json({

                success: true,

                message:
                    `Application ${status.toLowerCase()} successfully.`,

                application,

            });

        }

        catch (error) {

            console.error(
                "Update application status error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Failed to update application status.",

            });

        }

    }
);


// ==========================================
// GET ALL APPLICATIONS
// ==========================================

router.get(
    "/applications",
    async (req, res) => {

        try {

            const applications =
                await LoanApplication
                    .find()
                    .sort({
                        createdAt: -1,
                    });

            return res.json({

                success: true,

                count:
                    applications.length,

                applications,

            });

        }

        catch (error) {

            console.error(
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Failed to fetch applications.",

            });

        }

    }
);


// ==========================================
// GET SINGLE APPLICATION
// ==========================================

router.get(
    "/applications/:id",
    async (req, res) => {

        try {

            const application =
                await LoanApplication.findById(
                    req.params.id
                );


            if (!application) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Application not found.",

                });

            }


            return res.json({

                success: true,

                application,

            });

        }

        catch (error) {

            console.error(
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Failed to fetch application.",

            });

        }

    }
);


// ==========================================
// GET USER LOAN OFFER
// ==========================================

router.get(
    "/my-offer",
    authMiddleware,
    async (req, res) => {

        try {

            const application =
                await LoanApplication.findOne({
                    userId:
                        req.user.userId,
                }).sort({
                    createdAt: -1,
                });


            if (!application) {

                return res.json({

                    success: true,

                    hasApplication: false,

                });

            }


            return res.json({

                success: true,

                hasApplication: true,

                application,

            });

        }

        catch (error) {

            console.error(
                "Get loan offer error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Failed to load loan offer.",

            });

        }

    }
);


// ==========================================
// ACCEPT LOAN OFFER
// ==========================================

router.put(
    "/my-offer/accept",
    authMiddleware,
    async (req, res) => {

        try {

            const {
                selectedLoanAmount,
                selectedTenure,
            } = req.body;


            // ======================================
            // FIND USER APPLICATION
            // ======================================

            const application =
                await LoanApplication.findOne({

                    userId:
                        req.user.userId,

                }).sort({

                    createdAt: -1,

                });


            if (!application) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Loan application not found.",

                });

            }


            // ======================================
            // MUST BE APPROVED
            // ======================================

            if (
                application.applicationStatus !==
                "Approved"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Loan application is not approved.",

                });

            }


            // ======================================
            // OFFER MUST BE PENDING
            // ======================================

            if (
                application.offerStatus !==
                "PendingAcceptance"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Loan offer is not available for acceptance.",

                });

            }


            // ======================================
            // AMOUNT / TENURE
            // ======================================

            const amount =
                Number(
                    selectedLoanAmount
                );

            const tenure =
                Number(
                    selectedTenure
                );


            if (
                !Number.isFinite(amount) ||
                amount <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid loan amount.",

                });

            }


            if (
                amount >
                Number(
                    application.approvedAmount
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Selected amount cannot exceed approved amount.",

                });

            }


            if (
                ![
                    3,
                    6,
                    9,
                    12,
                ].includes(tenure)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid loan tenure.",

                });

            }


            // ======================================
            // INTEREST RATE
            // ======================================

            const interestRateMap = {

                3:
                    application
                        .interestRates
                        .threeMonths,

                6:
                    application
                        .interestRates
                        .sixMonths,

                9:
                    application
                        .interestRates
                        .nineMonths,

                12:
                    application
                        .interestRates
                        .twelveMonths,

            };


            const interestRate =
                Number(
                    interestRateMap[
                    tenure
                    ]
                );


            // ======================================
            // SIMPLE INTEREST
            // ======================================

            const totalInterest =
                amount *
                (
                    interestRate /
                    100
                ) *
                (
                    tenure /
                    12
                );


            const totalRepayment =
                amount +
                totalInterest;


            const emi =
                totalRepayment /
                tenure;


            // ======================================
            // PROCESSING FEE
            // ======================================

            const processingFee =
                amount *
                (
                    Number(
                        application
                            .processingFeePercent
                    ) /
                    100
                );


            const netDisbursement =
                amount -
                processingFee;


            // ======================================
            // LOAN DATES
            // ======================================

            const startDate =
                new Date();


            const endDate =
                new Date(
                    startDate
                );


            endDate.setMonth(
                endDate.getMonth() +
                tenure
            );


            // ======================================
            // SAVE SELECTED LOAN DETAILS
            // ======================================

            application.selectedLoanAmount =
                amount;

            application.selectedTenure =
                tenure;

            application.selectedInterestRate =
                interestRate;

            application.processingFeeAmount =
                processingFee;

            application.netDisbursementAmount =
                netDisbursement;

            application.emiAmount =
                emi;

            application.totalInterestAmount =
                totalInterest;

            application.totalRepaymentAmount =
                totalRepayment;

            application.loanStartDate =
                startDate;

            application.loanEndDate =
                endDate;

            application.userOfferAcceptedAt =
                new Date();

            application.acceptedAt =
                new Date();


            // ======================================
            // OFFER ACCEPTED
            // ======================================

            application.offerStatus =
                "Accepted";


            // ======================================
            // LOAN ACTIVE
            // ======================================

            application.loanStatus =
                "Active";


            // ======================================
            // DISBURSEMENT
            // ======================================

            application.disbursementStatus =
                "Pending";


            await application.save();


            return res.json({

                success: true,

                message:
                    "Loan offer accepted successfully.",

                application,

            });

        }

        catch (error) {

            console.error(
                "Accept loan offer error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Failed to accept loan offer.",

            });

        }

    }
);


// ==========================================
// CHECK USER LOAN STATUS
// ==========================================

router.get(
    "/my-status",
    authMiddleware,
    async (req, res) => {

        try {

            const latestApplication =
                await LoanApplication.findOne({

                    userId:
                        req.user.userId,

                }).sort({

                    createdAt: -1,

                });


            // ==========================================
            // NO APPLICATION
            // ==========================================

            if (!latestApplication) {

                return res.json({

                    success: true,

                    hasApplication: false,

                    canApply: true,

                });

            }


            // ==========================================
            // REJECTED
            // ==========================================

            if (
                latestApplication.applicationStatus ===
                "Rejected"
            ) {

                const isBlocked =
                    latestApplication
                        .reapplyBlockedUntil &&
                    new Date() <
                    new Date(
                        latestApplication
                            .reapplyBlockedUntil
                    );


                return res.json({

                    success: true,

                    hasApplication: true,

                    applicationStatus:
                        "Rejected",

                    canApply:
                        !isBlocked,

                    reapplyBlockedUntil:
                        latestApplication
                            .reapplyBlockedUntil,

                    offerStatus:
                        "None",

                    loanStatus:
                        "NotStarted",

                });

            }


            // ==========================================
            // PENDING
            // ==========================================

            if (
                latestApplication.applicationStatus ===
                "Pending"
            ) {

                return res.json({

                    success: true,

                    hasApplication: true,

                    applicationStatus:
                        "Pending",

                    canApply: false,

                    offerStatus:
                        "None",

                    loanStatus:
                        "NotStarted",

                });

            }


            // ==========================================
            // APPROVED
            // ==========================================

            if (
                latestApplication.applicationStatus ===
                "Approved"
            ) {

                return res.json({

                    success: true,

                    hasApplication: true,

                    applicationStatus:
                        "Approved",


                    // ==================================
                    // OFFER
                    // ==================================

                    offerStatus:
                        latestApplication
                            .offerStatus,

                    approvedAmount:
                        latestApplication
                            .approvedAmount,

                    interestRates:
                        latestApplication
                            .interestRates,

                    processingFeePercent:
                        latestApplication
                            .processingFeePercent,

                    foreclosureInterestPercent:
                        latestApplication
                            .foreclosureInterestPercent,


                    // ==================================
                    // SELECTED LOAN
                    // ==================================

                    selectedLoanAmount:
                        latestApplication
                            .selectedLoanAmount,

                    selectedTenure:
                        latestApplication
                            .selectedTenure,

                    selectedInterestRate:
                        latestApplication
                            .selectedInterestRate,

                    processingFeeAmount:
                        latestApplication
                            .processingFeeAmount,

                    netDisbursementAmount:
                        latestApplication
                            .netDisbursementAmount,

                    emiAmount:
                        latestApplication
                            .emiAmount,

                    totalInterestAmount:
                        latestApplication
                            .totalInterestAmount,

                    totalRepaymentAmount:
                        latestApplication
                            .totalRepaymentAmount,


                    // ==================================
                    // LOAN STATUS
                    // ==================================

                    loanStatus:
                        latestApplication
                            .loanStatus,

                    disbursementStatus:
                        latestApplication
                            .disbursementStatus,

                    amountPaid:
                        latestApplication
                            .amountPaid,

                    outstandingAmount:
                        latestApplication
                            .outstandingAmount,

                    nextPaymentDate:
                        latestApplication
                            .nextPaymentDate,

                    loanStartDate:
                        latestApplication
                            .loanStartDate,

                    loanEndDate:
                        latestApplication
                            .loanEndDate,

                    foreclosureAmount:
                        latestApplication
                            .foreclosureAmount,

                    foreclosureEligible:
                        latestApplication
                            .foreclosureEligible,

                    acceptedAt:
                        latestApplication
                            .acceptedAt,

                    userOfferAcceptedAt:
                        latestApplication
                            .userOfferAcceptedAt,

                });

            }


            // ==========================================
            // FALLBACK
            // ==========================================

            return res.json({

                success: true,

                hasApplication: true,

                applicationStatus:
                    latestApplication
                        .applicationStatus,

                canApply: false,

                offerStatus:
                    latestApplication
                        .offerStatus,

                loanStatus:
                    latestApplication
                        .loanStatus,

            });

        }

        catch (error) {

            console.error(
                "Application status error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Failed to check application status.",

            });

        }

    }
);


// ==========================================
// MULTER ERROR HANDLER
// ==========================================

router.use(
    (
        error,
        req,
        res,
        next
    ) => {

        if (
            error instanceof
            multer.MulterError
        ) {

            return res.status(400).json({

                success: false,

                message:
                    error.code ===
                        "LIMIT_FILE_SIZE"

                        ? "File size must be less than 5 MB."

                        : error.message,

            });

        }


        if (error) {

            return res.status(400).json({

                success: false,

                message:
                    error.message,

            });

        }


        next();

    }
);


module.exports = router;