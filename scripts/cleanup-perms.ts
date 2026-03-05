import * as fs from 'fs';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { permissions, rolePermissions } from '../src/lib/db/schema';
import { notInArray, eq } from 'drizzle-orm';

const validPermissions = [
    "dashboard.view",
    "reports.portfolio",
    "reports.overdue",
    "reports.cashflow",
    "cajas.view",
    "cajas.manage",
    "cajas.movements",
    "clients.view",
    "clients.create",
    "clients.edit",
    "clients.delete",
    "payments.register",
    "payments.history",
    "collections.view",
    "collections.manage",
    "loans.view",
    "loans.create",
    "loans.approve",
    "loans.disburse",
    "loans.annul",
    "loans.types.manage",
    "users.view",
    "users.manage",
    "roles.manage"
];

async function main() {
    const envContent = fs.readFileSync('.env', 'utf8');
    const dbUrl = envContent.match(/DATABASE_URL=['"]?(.+?)['"]?$/m)![1];

    const sql = neon(dbUrl);
    const db = drizzle(sql);

    console.log("🧹 Iniciando limpieza de permisos antiguos...");

    // 1. Identificar permisos inválidos
    const allPerms = await db.select().from(permissions);
    const invalidPerms = allPerms.filter(p => !validPermissions.includes(p.name));

    if (invalidPerms.length === 0) {
        console.log("✅ No se encontraron permisos antiguos para limpiar.");
        return;
    }

    console.log(`🗑️ Eliminando ${invalidPerms.length} permisos antiguos y sus asociaciones...`);

    for (const p of invalidPerms) {
        // Primero eliminar asociaciones
        await db.delete(rolePermissions).where(eq(rolePermissions.permissionId, p.id));
        // Luego eliminar el permiso
        await db.delete(permissions).where(eq(permissions.id, p.id));
        console.log(`   - Eliminado: ${p.name}`);
    }

    console.log("✨ Limpieza completada.");
}

main().catch(console.error);
