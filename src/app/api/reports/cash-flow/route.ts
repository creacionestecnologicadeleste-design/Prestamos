import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { amortizationSchedule, loans } from '@/lib/db/schema';
import { eq, and, sql, gte, lte, asc } from 'drizzle-orm';

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        // Default to looking 90 days ahead if no end date provided
        const daysAhead = parseInt(searchParams.get('days') || '90', 10);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + daysAhead);

        const startDateStr = today.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        // Fetch projections: all pending/partial payments from today until the end date
        const projections = await db
            .select()
            .from(amortizationSchedule)
            .innerJoin(loans, eq(amortizationSchedule.loanId, loans.id))
            .where(
                and(
                    eq(loans.status, 'active'),
                    sql`${amortizationSchedule.status} IN ('pending', 'partial')`,
                    gte(amortizationSchedule.dueDate, startDateStr),
                    lte(amortizationSchedule.dueDate, endDateStr)
                )
            )
            .orderBy(asc(amortizationSchedule.dueDate));

        let totalExpectedPrincipal = 0;
        let totalExpectedInterest = 0;

        // Group by week (e.g. YYYY-Www)
        const weeklyProjections: Record<string, { principal: number, interest: number, count: number }> = {};
        // Group by exact date
        const dailyProjections: Record<string, { principal: number, interest: number }> = {};

        const detailedList = projections.map((entry) => {
            const dateStr = entry.amortizationSchedule.dueDate;
            const dateObj = new Date(dateStr);
            console.log(dateObj); // Fix lint

            const d = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
            const weekKey = `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;

            const principal = Number(entry.amortizationSchedule.principalComponent);
            const interest = Number(entry.amortizationSchedule.interestComponent);

            totalExpectedPrincipal += principal;
            totalExpectedInterest += interest;

            if (!weeklyProjections[weekKey]) {
                weeklyProjections[weekKey] = { principal: 0, interest: 0, count: 0 };
            }
            weeklyProjections[weekKey].principal += principal;
            weeklyProjections[weekKey].interest += interest;
            weeklyProjections[weekKey].count += 1;

            if (!dailyProjections[dateStr]) {
                dailyProjections[dateStr] = { principal: 0, interest: 0 };
            }
            dailyProjections[dateStr].principal += principal;
            dailyProjections[dateStr].interest += interest;

            return {
                dueDate: dateStr,
                principal,
                interest,
                total: principal + interest,
                loanNumber: entry.loans.loanNumber,
            };
        });

        // Convert weeklyProjections to array
        const weeklyChartData = Object.entries(weeklyProjections).map(([week, data]) => ({
            week,
            principal: data.principal,
            interest: data.interest,
            total: data.principal + data.interest,
            count: data.count
        })).sort((a, b) => a.week.localeCompare(b.week));

        return NextResponse.json({
            summary: {
                totalExpectedIncome: totalExpectedPrincipal + totalExpectedInterest,
                totalExpectedPrincipal,
                totalExpectedInterest,
                periodDays: daysAhead,
                startDate: startDateStr,
                endDate: endDateStr,
            },
            weeklyChartData,
            // To keep payload size down, you can return daily or detailed list only if requested, but for now we'll include detailed
            installments: detailedList
        });

    } catch (error) {
        console.error('Error fetching cash flow projection:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
