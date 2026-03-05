import * as fs from 'fs';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { roles, rolePermissions, permissions } from './src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    const envContent = fs.readFileSync('.env', 'utf8');
    const dbUrl = envContent.match(/DATABASE_URL=['"]?(.+?)['"]?$/m)![1];

    const sql = neon(dbUrl);
    const db = drizzle(sql);

    let output = "--- DATABASE PERMISSION DUMP ---\n\n";

    const allRoles = await db.select().from(roles);
    for (const role of allRoles) {
        output += `ROLE: ${role.name} (${role.id})\n`;
        const perms = await db
            .select({
                name: permissions.name,
                module: permissions.module
            })
            .from(rolePermissions)
            .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
            .where(eq(rolePermissions.roleId, role.id));

        if (perms.length === 0) {
            output += "  No permissions found.\n";
        } else {
            perms.forEach((p: any) => {
                output += `  - ${p.module}: ${p.name}\n`;
            });
        }
        output += "\n";
    }

    fs.writeFileSync('perm_dump.txt', output);
    console.log("Dump saved to perm_dump.txt");
}

main().catch(e => {
    fs.writeFileSync('perm_dump_error.txt', e.stack!);
    console.error(e);
});
