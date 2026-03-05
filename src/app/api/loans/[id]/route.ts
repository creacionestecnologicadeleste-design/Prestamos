import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loans } from "@/lib/db/schema";
import { loanApprovalSchema, loanUpdateSchema } from "@/lib/validations/loan.schema";
import { eq } from "drizzle-orm";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const json = await req.json();

        // Check if it's an approval or a general update
        const isApproval = json.status === "approved" || json.status === "rejected" || json.status === "annulled";

        if (isApproval) {
            const body = loanApprovalSchema.parse(json);
            const [updatedLoan] = await db.update(loans)
                .set({
                    status: body.status,
                    approvedAmount: body.approvedAmount?.toString(),
                    disbursementDate: body.disbursementDate,
                })
                .where(eq(loans.id, id))
                .returning();
            return NextResponse.json(updatedLoan);
        } else {
            const body = loanUpdateSchema.parse(json);
            const [updatedLoan] = await db.update(loans)
                .set({
                    purpose: body.purpose,
                    loanNumber: body.loanNumber,
                })
                .where(eq(loans.id, id))
                .returning();
            return NextResponse.json(updatedLoan);
        }
    } catch (error) {
        console.error("[LOAN_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const loan = await db.query.loans.findFirst({
            where: eq(loans.id, id),
            with: {
                client: true,
                loanType: true,
                schedule: true,
            },
        });

        if (!loan) return new NextResponse("Not Found", { status: 404 });

        return NextResponse.json(loan);
    } catch (error) {
        console.error("[LOAN_GET_BY_ID]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
