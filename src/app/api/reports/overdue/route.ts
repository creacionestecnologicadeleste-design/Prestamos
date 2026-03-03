import { NextResponse } from "next/server";

import { and, desc, eq, lt, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { amortizationSchedule, clients, loans } from "@/lib/db/schema";

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
          eq(loans.status, "active"),
          lt(amortizationSchedule.dueDate, today.toISOString().split("T")[0]),
          sql`${amortizationSchedule.status} IN ('pending', 'partial')`,
        ),
      )
      .orderBy(desc(amortizationSchedule.dueDate));

    // Aggregate Data
    let totalOverdueCapital = 0;
    let totalOverdueInterest = 0;
    const buckets = {
      "1-15 días": { count: 0, amount: 0 },
      "16-30 días": { count: 0, amount: 0 },
      "31-60 días": { count: 0, amount: 0 },
      "60+ días": { count: 0, amount: 0 },
    };
    const uniqueLoansInArrears = new Set<string>();

    const detailedList = overdueInstallments.map((entry) => {
      const dueDate = new Date(entry.amortization_schedule.dueDate);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      const principal = Number(entry.amortization_schedule.principalAmount);
      const interest = Number(entry.amortization_schedule.interestAmount);
      const total = principal + interest;

      totalOverdueCapital += principal;
      totalOverdueInterest += interest;
      uniqueLoansInArrears.add(entry.loans.id);

      // Bucket classification
      if (daysOverdue <= 15) {
        buckets["1-15 días"].count++;
        buckets["1-15 días"].amount += total;
      } else if (daysOverdue <= 30) {
        buckets["16-30 días"].count++;
        buckets["16-30 días"].amount += total;
      } else if (daysOverdue <= 60) {
        buckets["31-60 días"].count++;
        buckets["31-60 días"].amount += total;
      } else {
        buckets["60+ días"].count++;
        buckets["60+ días"].amount += total;
      }

      return {
        id: entry.amortization_schedule.id,
        installmentNumber: entry.amortization_schedule.installmentNumber,
        dueDate: entry.amortization_schedule.dueDate,
        daysOverdue,
        principalAmount: principal,
        interestAmount: interest,
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
        },
      };
    });

    // Get total active portfolio to calculate Global Default Rate
    const activeLoans = await db.select({ amount: loans.amount }).from(loans).where(eq(loans.status, "active"));
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
        totalActivePortfolio,
      },
      buckets,
      installments: detailedList,
    });
  } catch (error) {
    console.error("Error fetching overdue analytics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
