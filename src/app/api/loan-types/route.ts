import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loanTypes } from "@/lib/db/schema";
import { loanTypeSchema } from "@/lib/validations/loan.schema";
import { desc } from "drizzle-orm";

export async function GET() {
    try {
        const types = await db.query.loanTypes.findMany({
            orderBy: [desc(loanTypes.createdAt)],
        });
        return NextResponse.json(types);
    } catch (error) {
        console.error("[LOAN_TYPES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const body = loanTypeSchema.parse(json);

        const [newType] = await db.insert(loanTypes).values({
            ...body,
            interestRateDefault: body.interestRateDefault.toString(),
            maxAmount: body.maxAmount?.toString(),
        }).returning();

        return NextResponse.json(newType);
    } catch (error) {
        console.error("[LOAN_TYPES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
