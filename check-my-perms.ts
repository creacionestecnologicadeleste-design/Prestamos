import { db } from "./src/lib/db";
import { users, roles, rolePermissions, permissions } from "./src/lib/db/schema";
import { eq } from "drizzle-orm";

async function checkCurrentUsers() {
    console.log("--- ACTUAL USER ROLES & PERMISSIONS ---");

    const allUsers = await db.select({
        email: users.email,
        name: users.name,
        roleName: roles.name,
        roleId: roles.id
    })
        .from(users)
        .leftJoin(roles, eq(users.roleId, roles.id));

    for (const u of allUsers) {
        console.log(`\nUSUARIO: ${u.email} (${u.name})`);
        console.log(`ROL ASIGNADO: ${u.roleName || "SIN ROL"}`);

        if (u.roleId) {
            const perms = await db.select({
                name: permissions.name,
                desc: permissions.description
            })
                .from(rolePermissions)
                .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
                .where(eq(rolePermissions.roleId, u.roleId));

            console.log("PERMISOS ACTIVOS:");
            perms.forEach(p => console.log(`  - ${p.name}: ${p.desc}`));
        }
    }
}

checkCurrentUsers().catch(console.error);
