import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { loans, clients, loanTypes, amortizationSchedule } from '@/lib/db/schema';
import { sql, eq, and, or } from 'drizzle-orm';

export async function GET() {
    try {
        // 1. Core KPIs
        const [kpis] = await db
            .select({
                totalPortfolio: sql<string>`COALESCE(SUM(CAST(${loans.amount} AS DECIMAL)), 0)`,
                activeLoansCount: sql<number>`COUNT(*) FILTER (WHERE ${loans.status} IN ('active', 'approved'))`,
            })
            .from(loans)
            .where(or(eq(loans.status, 'active'), eq(loans.status, 'approved')));

        // 2. Projected Interest (Pending installments)
        const [interestStats] = await db
            .select({
                projectedInterest: sql<string>`COALESCE(SUM(CAST(${amortizationSchedule.interestAmount} AS DECIMAL)), 0)`,
            })
            .from(amortizationSchedule)
            .where(eq(amortizationSchedule.status, 'pending'));

        // 3. Overdue Amount
        const [overdueStats] = await db
            .select({
                totalOverdue: sql<string>`COALESCE(SUM(CAST(${amortizationSchedule.totalAmount} AS DECIMAL)), 0)`,
            })
            .from(amortizationSchedule)
            .where(eq(amortizationSchedule.status, 'overdue'));

        // 4. Active Loans List
        const activeLoansList = await db.query.loans.findMany({
            where: or(eq(loans.status, 'active'), eq(loans.status, 'approved')),
            with: {
                client: true,
                loanType: true,
                schedule: {
                    where: eq(amortizationSchedule.status, 'pending'),
                    orderBy: (schedule, { asc }) => [asc(schedule.dueDate)],
                    limit: 1
                }
            },
            orderBy: (loans, { desc }) => [desc(loans.createdAt)],
        });

        return NextResponse.json({
            stats: {
                totalPortfolio: Number(kpis.totalPortfolio),
                activeLoansCount: Number(kpis.activeLoansCount),
                projectedInterest: Number(interestStats.projectedInterest),
                totalOverdue: Number(overdueStats.totalOverdue),
            },
            loans: activeLoansList,
        });
    } catch (error) {
        console.error('[REPORT_PORTFOLIO_GET]', error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
