const fs = require('fs');
const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const { roles, rolePermissions, permissions } = require('./src/lib/db/schema');
const { eq } = require('drizzle-orm');

async function main() {
    const envContent = fs.readFileSync('.env', 'utf8');
    const dbUrl = envContent.match(/DATABASE_URL=['"]?(.+?)['"]?$/m)[1];

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
            perms.forEach(p => {
                output += `  - ${p.module}: ${p.name}\n`;
            });
        }
        output += "\n";
    }

    fs.writeFileSync('perm_dump.txt', output);
    console.log("Dump saved to perm_dump.txt");
}

main().catch(e => {
    fs.writeFileSync('perm_dump_error.txt', e.stack);
    console.error(e);
});
