import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { penalties, amortizationSchedule, loans, clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const penaltiesList = await db
            .select({
                id: penalties.id,
                daysOverdue: penalties.daysOverdue,
                penaltyRate: penalties.penaltyRate,
                penaltyAmount: penalties.penaltyAmount,
                isPaid: penalties.isPaid,
                createdAt: penalties.createdAt,
                schedule: {
                    id: amortizationSchedule.id,
                    installmentNumber: amortizationSchedule.installmentNumber,
                    dueDate: amortizationSchedule.dueDate,
                },
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
            .from(penalties)
            .innerJoin(amortizationSchedule, eq(penalties.scheduleId, amortizationSchedule.id))
            .innerJoin(loans, eq(penalties.loanId, loans.id))
            .innerJoin(clients, eq(loans.clientId, clients.id));

        return NextResponse.json(penaltiesList);
    } catch (error) {
        console.error("Error fetching penalties:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
