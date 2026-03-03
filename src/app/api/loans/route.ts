import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loans, amortizationSchedule } from "@/lib/db/schema";
import { loanApplicationSchema } from "@/lib/validations/loan.schema";
import { calculateAmortization } from "@/lib/utils/amortization";
import { desc } from "drizzle-orm";

export async function GET() {
    try {
        const allLoans = await db.query.loans.findMany({
            with: {
                client: true,
                loanType: true,
            },
            orderBy: [desc(loans.createdAt)],
        });
        return NextResponse.json(allLoans);
    } catch (error) {
        console.error("[LOANS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const body = loanApplicationSchema.parse(json);

        // Generate a unique loan number (simple implementation)
        const loanNumber = `PRE-${Date.now().toString().slice(-8)}`;

        const [newLoan] = await db.insert(loans).values({
            clientId: body.clientId,
            loanTypeId: body.loanTypeId,
            loanNumber,
            amount: body.amount.toString(),
            interestRate: body.interestRate.toString(),
            termMonths: body.termMonths,
            paymentFrequency: body.paymentFrequency,
            method: body.method,
            purpose: body.purpose,
            status: "pending",
        }).returning();

        // Generate initial amortization schedule
        const schedule = calculateAmortization(
            body.amount,
            body.interestRate,
            body.termMonths,
            body.method,
            body.firstPaymentDate ? new Date(body.firstPaymentDate) : new Date(),
            body.paymentFrequency
        );

        if (schedule.length > 0) {
            await db.insert(amortizationSchedule).values(
                schedule.map((row) => ({
                    loanId: newLoan.id,
                    installmentNumber: row.installmentNumber,
                    dueDate: row.dueDate.toISOString().split('T')[0],
                    principalAmount: row.principalAmount.toString(),
                    interestAmount: row.interestAmount.toString(),
                    totalAmount: row.totalAmount.toString(),
                    remainingBalance: row.remainingBalance.toString(),
                    status: "pending" as const,
                }))
            );
        }

        return NextResponse.json(newLoan);
    } catch (error) {
        console.error("[LOANS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
