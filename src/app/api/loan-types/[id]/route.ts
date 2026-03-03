import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loanTypes } from "@/lib/db/schema";
import { loanTypeSchema } from "@/lib/validations/loan.schema";
import { eq } from "drizzle-orm";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const type = await db.query.loanTypes.findFirst({
            where: eq(loanTypes.id, id),
        });

        if (!type) {
            return new NextResponse("Not Found", { status: 404 });
        }

        return NextResponse.json(type);
    } catch (error) {
        console.error("[LOAN_TYPE_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const json = await req.json();
        const body = loanTypeSchema.parse(json);

        const [updatedType] = await db.update(loanTypes)
            .set({
                ...body,
                interestRateDefault: body.interestRateDefault.toString(),
                maxAmount: body.maxAmount?.toString(),
            })
            .where(eq(loanTypes.id, id))
            .returning();

        return NextResponse.json(updatedType);
    } catch (error) {
        console.error("[LOAN_TYPE_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check if there are loans using this type
        // In a real app, we might want to check the 'loans' table first
        // or just rely on foreign key constraints if they exist.

        await db.delete(loanTypes)
            .where(eq(loanTypes.id, id));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[LOAN_TYPE_DELETE]", error);

        // Handle foreign key constraint violation (e.g., if loans already use this type)
        if (error.code === '23503') {
            return new NextResponse("No se puede eliminar este tipo de préstamo porque ya existen préstamos asociados a él.", { status: 400 });
        }

        return new NextResponse("Internal Error", { status: 500 });
    }
}
