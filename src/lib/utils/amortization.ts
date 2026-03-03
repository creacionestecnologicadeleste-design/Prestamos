export interface AmortizationRow {
    installmentNumber: number;
    dueDate: Date;
    principalAmount: number;
    interestAmount: number;
    totalAmount: number;
    remainingBalance: number;
}

export function calculateAmortization(
    amount: number,
    annualInterestRate: number,
    termMonths: number, // In monthly frequency this is months, in others it's periods
    method: 'french' | 'german',
    startDate: Date = new Date(),
    frequency: 'weekly' | 'biweekly' | 'monthly' = 'monthly'
): AmortizationRow[] {
    let ratePerPeriod = 0;
    let totalPeriods = termMonths;

    if (frequency === 'monthly') {
        ratePerPeriod = annualInterestRate / 100 / 12;
    } else if (frequency === 'biweekly') {
        ratePerPeriod = annualInterestRate / 100 / 24;
    } else if (frequency === 'weekly') {
        ratePerPeriod = annualInterestRate / 100 / 52;
    }

    const schedule: AmortizationRow[] = [];
    let remainingBalance = amount;

    if (method === 'french') {
        // Fixed installment formula: A = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
        const installment = ratePerPeriod > 0
            ? amount * (ratePerPeriod * Math.pow(1 + ratePerPeriod, totalPeriods)) / (Math.pow(1 + ratePerPeriod, totalPeriods) - 1)
            : amount / totalPeriods;

        for (let i = 1; i <= totalPeriods; i++) {
            const interestAmount = remainingBalance * ratePerPeriod;
            const principalAmount = installment - interestAmount;
            remainingBalance -= principalAmount;

            const dueDate = new Date(startDate);
            if (frequency === 'monthly') {
                dueDate.setMonth(dueDate.getMonth() + i);
            } else if (frequency === 'biweekly') {
                dueDate.setDate(dueDate.getDate() + (i * 14));
            } else if (frequency === 'weekly') {
                dueDate.setDate(dueDate.getDate() + (i * 7));
            }

            schedule.push({
                installmentNumber: i,
                dueDate,
                principalAmount: Number(principalAmount.toFixed(2)),
                interestAmount: Number(interestAmount.toFixed(2)),
                totalAmount: Number(installment.toFixed(2)),
                remainingBalance: Number(Math.max(0, remainingBalance).toFixed(2)),
            });
        }
    } else {
        // German method: Fixed principal
        const fixedPrincipal = amount / totalPeriods;

        for (let i = 1; i <= totalPeriods; i++) {
            const interestAmount = remainingBalance * ratePerPeriod;
            const installment = fixedPrincipal + interestAmount;
            remainingBalance -= fixedPrincipal;

            const dueDate = new Date(startDate);
            if (frequency === 'monthly') {
                dueDate.setMonth(dueDate.getMonth() + i);
            } else if (frequency === 'biweekly') {
                dueDate.setDate(dueDate.getDate() + (i * 14));
            } else if (frequency === 'weekly') {
                dueDate.setDate(dueDate.getDate() + (i * 7));
            }

            schedule.push({
                installmentNumber: i,
                dueDate,
                principalAmount: Number(fixedPrincipal.toFixed(2)),
                interestAmount: Number(interestAmount.toFixed(2)),
                totalAmount: Number(installment.toFixed(2)),
                remainingBalance: Number(Math.max(0, remainingBalance).toFixed(2)),
            });
        }
    }

    return schedule;
}
