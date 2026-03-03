import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { amortizationSchedule, loans, clients } from "@/lib/db/schema";
import { eq, lt, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const today = new Date().toISOString().split('T')[0];

        const overdue = await db
            .select({
                id: amortizationSchedule.id,
                installmentNumber: amortizationSchedule.installmentNumber,
                dueDate: amortizationSchedule.dueDate,
                principalAmount: amortizationSchedule.principalAmount,
                interestAmount: amortizationSchedule.interestAmount,
                totalAmount: amortizationSchedule.totalAmount,
                remainingBalance: amortizationSchedule.remainingBalance,
                loan: {
                    id: loans.id,
                    loanNumber: loans.loanNumber,
                    loanTypeId: loans.loanTypeId,
                },
                client: {
                    id: clients.id,
                    firstName: clients.firstName,
                    lastName: clients.lastName,
                }
            })
            .from(amortizationSchedule)
            .innerJoin(loans, eq(amortizationSchedule.loanId, loans.id))
            .innerJoin(clients, eq(loans.clientId, clients.id))
            .where(
                and(
                    eq(amortizationSchedule.status, "pending"),
                    lt(amortizationSchedule.dueDate, today)
                )
            );

        return NextResponse.json(overdue);
    } catch (error) {
        console.error("Error fetching overdue installments:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
