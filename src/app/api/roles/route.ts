import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { roles, rolePermissions, permissions } from "@/lib/db/schema";
import { roleSchema } from "@/lib/validations/user.schema";
import { eq } from "drizzle-orm";

export async function GET() {
    try {
        const allRoles = await db.query.roles.findMany({
            with: {
                permissions: {
                    with: {
                        permission: true,
                    }
                },
            },
        });

        return NextResponse.json(allRoles);
    } catch (error) {
        console.error("[ROLES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const body = roleSchema.parse(json);

        const { name, description, permissionIds } = body;

        const result = await db.insert(roles).values({
            name,
            description,
        }).returning();

        const newRole = result[0];

        if (permissionIds && permissionIds.length > 0) {
            await db.insert(rolePermissions).values(
                permissionIds.map((pId) => ({
                    roleId: newRole.id,
                    permissionId: pId,
                }))
            );
        }

        return NextResponse.json(newRole);
    } catch (error) {
        console.error("[ROLES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
