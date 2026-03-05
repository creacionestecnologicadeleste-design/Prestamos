import { config } from "dotenv";
config();
import { db } from "../src/lib/db";
import { roles, rolePermissions, permissions as permissionsTable } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("--- ROLES ---");
    const allRoles = await db.select().from(roles);
    console.table(allRoles);

    for (const role of allRoles) {
        console.log(`\n--- PERMISSIONS FOR ROLE: ${role.name} ---`);
        const perms = await db
            .select({
                permissionName: permissionsTable.name,
                module: permissionsTable.module
            })
            .from(rolePermissions)
            .innerJoin(permissionsTable, eq(rolePermissions.permissionId, permissionsTable.id))
            .where(eq(rolePermissions.roleId, role.id));

        if (perms.length === 0) {
            console.log("No permissions found.");
        } else {
            console.table(perms);
        }
    }
}

main().catch(console.error);
