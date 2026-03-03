import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payments, loans, clients } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const history = await db
            .select({
                id: payments.id,
                amountPaid: payments.amountPaid,
                paymentDate: payments.paymentDate,
                paymentMethod: payments.paymentMethod,
                referenceNumber: payments.referenceNumber,
                lateFee: payments.lateFee,
                notes: payments.notes,
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
            .from(payments)
            .innerJoin(loans, eq(payments.loanId, loans.id))
            .innerJoin(clients, eq(loans.clientId, clients.id))
            .orderBy(desc(payments.paymentDate));

        return NextResponse.json(history);
    } catch (error) {
        console.error("Error fetching payment history:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
