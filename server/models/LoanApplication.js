const mongoose = require("mongoose");

const loanApplicationSchema = new mongoose.Schema(
    {
        // ==========================================
        // USER DETAILS
        // ==========================================

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        fullName: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },

        phone: {
            type: String,
            required: true,
            trim: true,
        },

        // ==========================================
        // LOAN APPLICATION
        // ==========================================

        loanType: {
            type: String,
            required: true,
            trim: true,
        },

        amount: {
            type: Number,
            required: true,
            min: 1,
        },

        income: {
            type: Number,
            required: true,
            min: 0,
        },

        employment: {
            type: String,
            required: true,
            trim: true,
        },

        familyPhone: {
            type: String,
            required: true,
            trim: true,
        },

        accountNumber: {
            type: String,
            required: true,
            trim: true,
        },

        ifscCode: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
        },

        // ==========================================
        // DOCUMENTS
        // ==========================================

        aadhaarFront: {
            type: String,
            required: true,
        },

        aadhaarBack: {
            type: String,
            required: true,
        },

        panCard: {
            type: String,
            required: true,
        },

        bankPassbook: {
            type: String,
            required: true,
        },

        selfie: {
            type: String,
            required: true,
        },

        // ==========================================
        // ELIGIBILITY
        // ==========================================

        eligibilityStatus: {
            type: String,
            default: "eligible",
        },

        // ==========================================
        // TERMS
        // ==========================================

        termsAccepted: {
            type: Boolean,
            default: false,
        },

        termsAcceptedAt: {
            type: Date,
            default: null,
        },

        // ==========================================
        // APPLICATION STATUS
        // ==========================================

        applicationStatus: {
            type: String,
            enum: [
                "Pending",
                "Approved",
                "Rejected",
            ],
            default: "Pending",
        },

        reapplyBlockedUntil: {
            type: Date,
            default: null,
        },

        // ==========================================
        // ADMIN APPROVAL
        // ==========================================

        approvedAmount: {
            type: Number,
            default: null,
        },

        // Interest options configured by admin
        interestRates: {
            threeMonths: {
                type: Number,
                default: 14,
            },

            sixMonths: {
                type: Number,
                default: 18,
            },

            nineMonths: {
                type: Number,
                default: 20,
            },

            twelveMonths: {
                type: Number,
                default: 24,
            },
        },

        processingFeePercent: {
            type: Number,
            default: 5,
        },

        foreclosureInterestPercent: {
            type: Number,
            default: 15,
        },

        // ==========================================
        // USER LOAN OFFER
        // ==========================================

        offerStatus: {
            type: String,
            enum: [
                "None",
                "PendingAcceptance",
                "Accepted",
                "Declined",
            ],
            default: "None",
        },

        userOfferAcceptedAt: {
            type: Date,
            default: null,
        },

        // ==========================================
        // SELECTED LOAN TERMS
        // ==========================================

        selectedLoanAmount: {
            type: Number,
            default: null,
        },

        selectedTenure: {
            type: Number,
            enum: [
                3,
                6,
                9,
                12,
                null,
            ],
            default: null,
        },

        selectedInterestRate: {
            type: Number,
            default: null,
        },

        // ==========================================
        // PROCESSING FEE / DISBURSEMENT
        // ==========================================

        processingFeeAmount: {
            type: Number,
            default: null,
        },

        netDisbursementAmount: {
            type: Number,
            default: null,
        },

        disbursementStatus: {
            type: String,
            enum: [
                "None",
                "Pending",
                "Disbursed",
            ],
            default: "None",
        },

        disbursedAt: {
            type: Date,
            default: null,
        },

        // ==========================================
        // EMI
        // ==========================================

        emiAmount: {
            type: Number,
            default: null,
        },

        totalInterestAmount: {
            type: Number,
            default: null,
        },

        totalRepaymentAmount: {
            type: Number,
            default: null,
        },

        // ==========================================
        // REPAYMENT
        // ==========================================

        repaymentDay: {
            type: Number,
            default: 6,
            min: 1,
            max: 28,
        },

        nextPaymentDate: {
            type: Date,
            default: null,
        },

        amountPaid: {
            type: Number,
            default: 0,
        },

        outstandingAmount: {
            type: Number,
            default: 0,
        },

        // ==========================================
        // LOAN DATES
        // ==========================================

        loanStartDate: {
            type: Date,
            default: null,
        },

        loanEndDate: {
            type: Date,
            default: null,
        },

        // ==========================================
        // FORECLOSURE
        // ==========================================

        foreclosureAmount: {
            type: Number,
            default: 0,
        },

        foreclosureEligible: {
            type: Boolean,
            default: true,
        },

        // ==========================================
        // LOAN STATUS
        // ==========================================

        loanStatus: {
            type: String,
            enum: [
                "NotStarted",
                "OfferPending",
                "Active",
                "Completed",
                "Foreclosed",
            ],
            default: "NotStarted",
        },

        acceptedAt: {
            type: Date,
            default: null,
        },

        completedAt: {
            type: Date,
            default: null,
        },

        foreclosedAt: {
            type: Date,
            default: null,
        },
    },

    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "LoanApplication",
    loanApplicationSchema
);