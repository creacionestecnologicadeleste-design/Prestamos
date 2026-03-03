import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { roles, rolePermissions } from "@/lib/db/schema";
import { roleSchema } from "@/lib/validations/user.schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ roleId: string }> }
) {
    try {
        const { roleId } = await params;
        const json = await req.json();
        const body = roleSchema.parse(json);
        const { name, description, permissionIds } = body;

        // Update role basic info
        await db.update(roles)
            .set({ name, description })
            .where(eq(roles.id, roleId));

        // Update permissions: Delete existing and insert new ones
        // This is a simple way to sync permissions
        await db.delete(rolePermissions)
            .where(eq(rolePermissions.roleId, roleId));

        if (permissionIds && permissionIds.length > 0) {
            await db.insert(rolePermissions).values(
                permissionIds.map((pId: string) => ({
                    roleId,
                    permissionId: pId,
                }))
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[ROLE_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ roleId: string }> }
) {
    try {
        const { roleId } = await params;

        // Note: Drizzle/Postgres will throw an error if there are users assigned to this role
        // because of the foreign key constraint. We should handle this or check manually.

        // First delete permissions
        await db.delete(rolePermissions)
            .where(eq(rolePermissions.roleId, roleId));

        // Then delete the role
        await db.delete(roles)
            .where(eq(roles.id, roleId));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[ROLE_DELETE]", error);
        if (error.code === '23503') { // Foreign key violation
            return new NextResponse("No se puede eliminar el rol porque tiene usuarios asignados.", { status: 400 });
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}
