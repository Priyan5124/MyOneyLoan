const express = require("express");
const LoanApplication = require("../models/LoanApplication");

const router = express.Router();


// =====================================================
// ADMIN LOGIN
// =====================================================

router.post("/login", async (req, res) => {
    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required.",
            });
        }

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (
            email.toLowerCase() !==
            adminEmail?.toLowerCase() ||
            password !== adminPassword
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid admin credentials.",
            });
        }

        return res.json({
            success: true,
            message: "Admin login successful.",
            admin: {
                email: adminEmail,
                role: "admin",
            },
        });

    } catch (error) {

        console.error(
            "Admin login error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Admin login failed.",
        });
    }
});


// =====================================================
// GET ALL APPLICATIONS
// =====================================================

router.get("/applications", async (req, res) => {
    try {

        const applications =
            await LoanApplication
                .find()
                .sort({ createdAt: -1 });

        return res.json({
            success: true,
            count: applications.length,
            applications,
        });

    } catch (error) {

        console.error(
            "Fetch applications error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch loan applications.",
        });
    }
});


// =====================================================
// GET SINGLE APPLICATION
// =====================================================

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
                        "Loan application not found.",
                });
            }

            return res.json({
                success: true,
                application,
            });

        } catch (error) {

            console.error(
                "Fetch application error:",
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


// =====================================================
// APPROVE LOAN
// =====================================================

router.put(
    "/applications/:id/approve",
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
                        "Loan application not found.",
                });
            }


            // ONLY PENDING

            if (
                application.applicationStatus !==
                "Pending"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `This application is already ${application.applicationStatus}.`,
                });
            }


            const {
                approvedAmount,
                interestRates,
                processingFeePercent,
                foreclosureInterestPercent,
            } = req.body;


            // =========================================
            // APPROVED AMOUNT
            // =========================================

            const finalApprovedAmount =
                Number(approvedAmount);

            if (
                !Number.isFinite(
                    finalApprovedAmount
                ) ||
                finalApprovedAmount <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Please enter a valid approved loan amount.",
                });
            }


            if (
                finalApprovedAmount >
                Number(application.amount)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Approved amount cannot exceed requested amount ₹${Number(
                            application.amount
                        ).toLocaleString("en-IN")}.`,
                });
            }


            // =========================================
            // INTEREST RATES
            // =========================================

            const finalInterestRates = {

                threeMonths:
                    interestRates?.threeMonths !==
                        undefined
                        ? Number(
                            interestRates.threeMonths
                        )
                        : 14,

                sixMonths:
                    interestRates?.sixMonths !==
                        undefined
                        ? Number(
                            interestRates.sixMonths
                        )
                        : 18,

                nineMonths:
                    interestRates?.nineMonths !==
                        undefined
                        ? Number(
                            interestRates.nineMonths
                        )
                        : 20,

                twelveMonths:
                    interestRates?.twelveMonths !==
                        undefined
                        ? Number(
                            interestRates.twelveMonths
                        )
                        : 24,
            };


            const rates =
                Object.values(
                    finalInterestRates
                );


            if (
                rates.some(
                    (rate) =>
                        !Number.isFinite(rate) ||
                        rate < 0 ||
                        rate > 100
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Interest rates must be between 0% and 100%.",
                });
            }


            // =========================================
            // PROCESSING FEE
            // =========================================

            const finalProcessingFee =
                processingFeePercent !==
                    undefined
                    ? Number(
                        processingFeePercent
                    )
                    : 5;


            if (
                !Number.isFinite(
                    finalProcessingFee
                ) ||
                finalProcessingFee < 0 ||
                finalProcessingFee > 100
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Processing fee must be between 0% and 100%.",
                });
            }


            // =========================================
            // FORECLOSURE INTEREST
            // =========================================

            const finalForeclosureInterest =
                foreclosureInterestPercent !==
                    undefined
                    ? Number(
                        foreclosureInterestPercent
                    )
                    : 15;


            if (
                !Number.isFinite(
                    finalForeclosureInterest
                ) ||
                finalForeclosureInterest < 0 ||
                finalForeclosureInterest > 100
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Foreclosure interest must be between 0% and 100%.",
                });
            }


            // =========================================
            // SAVE OFFER
            // =========================================

            application.applicationStatus =
                "Approved";

            application.approvedAmount =
                finalApprovedAmount;

            application.interestRates =
                finalInterestRates;

            application.processingFeePercent =
                finalProcessingFee;

            application.foreclosureInterestPercent =
                finalForeclosureInterest;


            // =========================================
            // USER MUST ACCEPT
            // =========================================

            application.offerStatus =
                "PendingAcceptance";

            application.loanStatus =
                "OfferPending";

            application.disbursementStatus =
                "Pending";


            // =========================================
            // RESET OLD LOAN DATA
            // =========================================

            application.selectedLoanAmount =
                null;

            application.selectedTenure =
                null;

            application.selectedInterestRate =
                null;

            application.processingFeeAmount =
                null;

            application.netDisbursementAmount =
                null;

            application.emiAmount =
                null;

            application.totalInterestAmount =
                null;

            application.totalRepaymentAmount =
                null;

            application.nextPaymentDate =
                null;

            application.loanStartDate =
                null;

            application.loanEndDate =
                null;

            application.userOfferAcceptedAt =
                null;

            application.acceptedAt =
                null;

            application.disbursedAt =
                null;


            await application.save();


            return res.json({

                success: true,

                message:
                    "Loan approved successfully. Loan offer sent to user.",

                application,

            });

        } catch (error) {

            console.error(
                "Approve loan error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to approve loan.",
            });
        }
    }
);


// =====================================================
// REJECT LOAN
// =====================================================

router.put(
    "/applications/:id/reject",
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
                        "Loan application not found.",
                });
            }


            if (
                application.applicationStatus !==
                "Pending"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `This application is already ${application.applicationStatus}.`,
                });
            }


            // =========================================
            // REJECT
            // =========================================

            application.applicationStatus =
                "Rejected";


            application.reapplyBlockedUntil =
                new Date(
                    Date.now() +
                    30 *
                    24 *
                    60 *
                    60 *
                    1000
                );


            // =========================================
            // CLEAR OFFER
            // =========================================

            application.offerStatus =
                "None";

            application.loanStatus =
                "NotStarted";

            application.disbursementStatus =
                "None";

            application.approvedAmount =
                null;

            application.processingFeePercent =
                5;

            application.foreclosureInterestPercent =
                15;

            application.selectedLoanAmount =
                null;

            application.selectedTenure =
                null;

            application.selectedInterestRate =
                null;

            application.processingFeeAmount =
                null;

            application.netDisbursementAmount =
                null;

            application.emiAmount =
                null;

            application.totalInterestAmount =
                null;

            application.totalRepaymentAmount =
                null;

            application.nextPaymentDate =
                null;

            application.loanStartDate =
                null;

            application.loanEndDate =
                null;

            application.userOfferAcceptedAt =
                null;

            application.acceptedAt =
                null;

            application.disbursedAt =
                null;


            await application.save();


            return res.json({

                success: true,

                message:
                    "Loan application rejected successfully.",

                application,

            });

        } catch (error) {

            console.error(
                "Reject loan error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to reject loan.",
            });
        }
    }
);


// =====================================================
// DASHBOARD STATS
// =====================================================

router.get("/stats", async (req, res) => {

    try {

        const total =
            await LoanApplication.countDocuments();

        const pending =
            await LoanApplication.countDocuments({
                applicationStatus:
                    "Pending",
            });

        const approved =
            await LoanApplication.countDocuments({
                applicationStatus:
                    "Approved",
            });

        const rejected =
            await LoanApplication.countDocuments({
                applicationStatus:
                    "Rejected",
            });


        return res.json({

            success: true,

            stats: {
                total,
                pending,
                approved,
                rejected,
            },

        });

    } catch (error) {

        console.error(
            "Stats error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to load dashboard statistics.",

        });
    }
});


module.exports = router;