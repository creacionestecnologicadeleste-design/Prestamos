import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { amortizationSchedule, loans, clients } from '@/lib/db/schema';
import { eq, and, lt, sql, desc } from 'drizzle-orm';

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Only fetch pending/partial entries whose due date has passed.
        // Also only consider active loans.
        const overdueInstallments = await db
            .select()
            .from(amortizationSchedule)
            .innerJoin(loans, eq(amortizationSchedule.loanId, loans.id))
            .innerJoin(clients, eq(loans.clientId, clients.id))
            .where(
                and(
                    eq(loans.status, 'active'),
                    lt(amortizationSchedule.dueDate, today.toISOString().split('T')[0]),
                    sql`${amortizationSchedule.status} IN ('pending', 'partial')`
                )
            )
            .orderBy(desc(amortizationSchedule.dueDate));

        // Aggregate Data
        let totalOverdueCapital = 0;
        let totalOverdueInterest = 0;
        const buckets = {
            '1-15 días': { count: 0, amount: 0 },
            '16-30 días': { count: 0, amount: 0 },
            '31-60 días': { count: 0, amount: 0 },
            '60+ días': { count: 0, amount: 0 },
        };
        const uniqueLoansInArrears = new Set<string>();

        const detailedList = overdueInstallments.map((entry) => {
            const dueDate = new Date(entry.amortizationSchedule.dueDate);
            const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

            const principal = Number(entry.amortizationSchedule.principalComponent);
            const interest = Number(entry.amortizationSchedule.interestComponent);
            const total = principal + interest;

            totalOverdueCapital += principal;
            totalOverdueInterest += interest;
            uniqueLoansInArrears.add(entry.loans.id);

            // Bucket classification
            if (daysOverdue <= 15) {
                buckets['1-15 días'].count++;
                buckets['1-15 días'].amount += total;
            } else if (daysOverdue <= 30) {
                buckets['16-30 días'].count++;
                buckets['16-30 días'].amount += total;
            } else if (daysOverdue <= 60) {
                buckets['31-60 días'].count++;
                buckets['31-60 días'].amount += total;
            } else {
                buckets['60+ días'].count++;
                buckets['60+ días'].amount += total;
            }

            return {
                id: entry.amortizationSchedule.id,
                installmentNumber: entry.amortizationSchedule.installmentNumber,
                dueDate: entry.amortizationSchedule.dueDate,
                daysOverdue,
                principalComponent: principal,
                interestComponent: interest,
                totalAmount: total,
                loan: {
                    id: entry.loans.id,
                    loanNumber: entry.loans.loanNumber,
                    amount: entry.loans.amount,
                },
                client: {
                    id: entry.clients.id,
                    firstName: entry.clients.firstName,
                    lastName: entry.clients.lastName,
                    cedula: entry.clients.cedula,
                }
            };
        });

        // Get total active portfolio to calculate Global Default Rate
        const activeLoans = await db.select({ amount: loans.amount }).from(loans).where(eq(loans.status, 'active'));
        const totalActivePortfolio = activeLoans.reduce((sum, loan) => sum + Number(loan.amount), 0);

        const totalOverdueAmount = totalOverdueCapital + totalOverdueInterest;
        const globalDefaultRate = totalActivePortfolio > 0 ? (totalOverdueAmount / totalActivePortfolio) * 100 : 0;

        return NextResponse.json({
            summary: {
                totalOverdueAmount,
                totalOverdueCapital,
                totalOverdueInterest,
                totalLoansInArrears: uniqueLoansInArrears.size,
                globalDefaultRate,
                totalActivePortfolio
            },
            buckets,
            installments: detailedList
        });

    } catch (error) {
        console.error('Error fetching overdue analytics:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
