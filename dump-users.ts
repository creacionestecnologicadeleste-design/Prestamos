import * as fs from 'fs';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users, roles } from './src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    const envContent = fs.readFileSync('.env', 'utf8');
    const dbUrl = envContent.match(/DATABASE_URL=['"]?(.+?)['"]?$/m)![1];

    const sql = neon(dbUrl);
    const db = drizzle(sql);

    let output = "--- USER ROLE DUMP ---\n\n";

    const allUsers = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            roleId: users.roleId,
            roleName: roles.name
        })
        .from(users)
        .leftJoin(roles, eq(users.roleId, roles.id));

    for (const u of allUsers) {
        output += `USER: ${u.name} (${u.email})\n`;
        output += `  Role: ${u.roleName} (${u.roleId})\n\n`;
    }

    fs.writeFileSync('user_dump.txt', output);
    console.log("User dump saved to user_dump.txt");
}

main().catch(e => {
    fs.writeFileSync('user_dump_error.txt', e.stack!);
    console.error(e);
});
