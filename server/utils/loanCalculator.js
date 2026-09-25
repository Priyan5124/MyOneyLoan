// ==========================================
// EMI CALCULATOR
// ==========================================

function calculateEMI(
    principal,
    annualInterestRate,
    tenureMonths
) {
    const monthlyRate =
        annualInterestRate / 12 / 100;

    if (monthlyRate === 0) {
        return principal / tenureMonths;
    }

    const emi =
        principal *
        monthlyRate *
        Math.pow(
            1 + monthlyRate,
            tenureMonths
        ) /
        (
            Math.pow(
                1 + monthlyRate,
                tenureMonths
            ) - 1
        );

    return Number(emi.toFixed(2));
}


// ==========================================
// LOAN SUMMARY
// ==========================================

function calculateLoanSummary(
    amount,
    interestRate,
    tenureMonths,
    processingFeeRate = 5
) {

    const emi = calculateEMI(
        amount,
        interestRate,
        tenureMonths
    );

    const totalRepayment =
        emi * tenureMonths;

    const totalInterest =
        totalRepayment - amount;

    const processingFee =
        amount * processingFeeRate / 100;

    const disbursedAmount =
        amount - processingFee;

    return {

        selectedAmount: amount,

        selectedInterestRate:
            interestRate,

        selectedTenure:
            tenureMonths,

        emiAmount:
            Number(emi.toFixed(2)),

        totalInterest:
            Number(totalInterest.toFixed(2)),

        totalRepaymentAmount:
            Number(totalRepayment.toFixed(2)),

        processingFeeRate,

        processingFeeAmount:
            Number(processingFee.toFixed(2)),

        disbursedAmount:
            Number(disbursedAmount.toFixed(2)),

    };
}


// ==========================================
// NEXT REPAYMENT DATE
// Every month 6th
// ==========================================

function getNextRepaymentDate() {

    const now = new Date();

    let year =
        now.getFullYear();

    let month =
        now.getMonth();

    // Current month's 6th
    let repaymentDate =
        new Date(
            year,
            month,
            6
        );

    // If 6th already passed,
    // move to next month
    if (repaymentDate <= now) {

        repaymentDate =
            new Date(
                year,
                month + 1,
                6
            );

    }

    return repaymentDate;
}


module.exports = {
    calculateEMI,
    calculateLoanSummary,
    getNextRepaymentDate,
};