import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactionCategories } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkPermission } from "@/lib/permissions";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const tipo = searchParams.get("tipo"); // optional filter by type

        const categories = await db.query.transactionCategories.findMany({
            where: tipo ? eq(transactionCategories.tipo, tipo as any) : undefined,
            orderBy: [desc(transactionCategories.createdAt)],
        });
        return NextResponse.json(categories);
    } catch (error) {
        console.error("[TRANSACTION_CATEGORIES_GET]", error);
        return NextResponse.json({ error: "Internal Error", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const hasPermission = await checkPermission("transactions.categories.manage");
        if (!hasPermission) return new NextResponse("Forbidden", { status: 403 });

        const json = await req.json();
        const { nombre, tipo, descripcion } = json;

        if (!nombre || !tipo) {
            return new NextResponse("Nombre y tipo son requeridos", { status: 400 });
        }

        const [newCategory] = await db.insert(transactionCategories).values({
            nombre,
            tipo,
            descripcion,
        }).returning();

        return NextResponse.json(newCategory);
    } catch (error) {
        console.error("[TRANSACTION_CATEGORIES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
