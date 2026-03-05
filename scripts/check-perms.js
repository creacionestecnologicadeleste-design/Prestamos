const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL=["']?(.+?)["']?\s*$/m);
const dbUrl = dbUrlMatch ? dbUrlMatch[1] : null;

if (!dbUrl) {
    console.error("Could not find DATABASE_URL in .env.local");
    process.exit(1);
}

process.env.DATABASE_URL = dbUrl;

// Now import the rest
const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const { roles, rolePermissions, permissions } = require('../src/lib/db/schema');
const { eq } = require('drizzle-orm');

async function main() {
    const sql = neon(dbUrl);
    const db = drizzle(sql);

    console.log("--- ROLES ---");
    const allRoles = await db.select().from(roles);
    console.table(allRoles);

    for (const role of allRoles) {
        console.log(`\n--- PERMISSIONS FOR ROLE: ${role.name} (${role.id}) ---`);
        const perms = await db
            .select({
                name: permissions.name,
                module: permissions.module
            })
            .from(rolePermissions)
            .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
            .where(eq(rolePermissions.roleId, role.id));

        if (perms.length === 0) {
            console.log("No permissions found.");
        } else {
            console.table(perms);
        }
    }
}

main().catch(console.error);
