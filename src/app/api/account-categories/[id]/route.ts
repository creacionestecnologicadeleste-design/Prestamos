import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accountCategories } from "@/lib/db/schema";
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

        const hasPermission = await checkPermission("accounts.categories.manage");
        if (!hasPermission) return new NextResponse("Forbidden", { status: 403 });

        const { id } = await params;
        const json = await req.json();
        const { nombre, descripcion, icon, isActive } = json;

        const [updatedCategory] = await db.update(accountCategories)
            .set({
                nombre,
                descripcion,
                icon,
                isActive,
            })
            .where(eq(accountCategories.id, id))
            .returning();

        return NextResponse.json(updatedCategory);
    } catch (error) {
        console.error("[ACCOUNT_CATEGORY_PATCH]", error);
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

        const hasPermission = await checkPermission("accounts.categories.manage");
        if (!hasPermission) return new NextResponse("Forbidden", { status: 403 });

        const { id } = await params;

        // Check if there are accounts using this category
        // TODO: For now, simple delete. In a real system we'd prevent delete if used.
        await db.delete(accountCategories)
            .where(eq(accountCategories.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[ACCOUNT_CATEGORY_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
