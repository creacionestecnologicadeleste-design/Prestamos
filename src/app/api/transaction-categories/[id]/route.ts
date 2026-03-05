import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactionCategories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkPermission } from "@/lib/permissions";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const hasPermission = await checkPermission("transactions.categories.manage");
        if (!hasPermission) return new NextResponse("Forbidden", { status: 403 });

        const { id } = await params;
        const json = await req.json();
        const { nombre, tipo, descripcion, isActive } = json;

        const [updatedCategory] = await db.update(transactionCategories)
            .set({
                nombre,
                tipo,
                descripcion,
                isActive,
            })
            .where(eq(transactionCategories.id, id))
            .returning();

        return NextResponse.json(updatedCategory);
    } catch (error) {
        console.error("[TRANSACTION_CATEGORY_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const hasPermission = await checkPermission("transactions.categories.manage");
        if (!hasPermission) return new NextResponse("Forbidden", { status: 403 });

        const { id } = await params;

        await db.delete(transactionCategories)
            .where(eq(transactionCategories.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[TRANSACTION_CATEGORY_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
