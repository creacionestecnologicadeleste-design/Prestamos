import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accountCategories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkPermission } from "@/lib/permissions";

export async function GET() {
    try {
        const categories = await db.query.accountCategories.findMany({
            orderBy: [desc(accountCategories.createdAt)],
        });
        return NextResponse.json(categories);
    } catch (error) {
        console.error("[ACCOUNT_CATEGORIES_GET]", error);
        return NextResponse.json({ error: "Internal Error", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const hasPermission = await checkPermission("accounts.categories.manage");
        if (!hasPermission) return new NextResponse("Forbidden", { status: 403 });

        const json = await req.json();
        const { nombre, descripcion, icon } = json;

        if (!nombre) {
            return new NextResponse("Nombre es requerido", { status: 400 });
        }

        const [newCategory] = await db.insert(accountCategories).values({
            nombre,
            descripcion,
            icon,
        }).returning();

        return NextResponse.json(newCategory);
    } catch (error) {
        console.error("[ACCOUNT_CATEGORIES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
