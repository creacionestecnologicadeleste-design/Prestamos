import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { permissions } from "../src/lib/db/schema";
import { sql as drizzleSql } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const permissionsData = [
    // Dashboard
    { name: "dashboard.view", module: "Dashboard", description: "Ver paneles de resumen y estadísticas generales." },

    // Reportes
    { name: "reports.portfolio", module: "Reportes", description: "Ver reporte detallado de la cartera de préstamos." },
    { name: "reports.overdue", module: "Reportes", description: "Ver reporte de clientes en mora y atrasos." },
    { name: "reports.cashflow", module: "Reportes", description: "Ver flujo de caja histórico y proyectado." },

    // Cajas
    { name: "cajas.view", module: "Cajas", description: "Ver el estado y saldo de las cajas físicas y digitales." },
    { name: "cajas.manage", module: "Cajas", description: "Abrir, cerrar y administrar configuraciones de cajas." },
    { name: "cajas.movements", module: "Cajas", description: "Registrar entradas, salidas y traspasos entre cajas." },

    // Clientes
    { name: "clients.view", module: "Clientes", description: "Ver el listado y perfiles de clientes." },
    { name: "clients.create", module: "Clientes", description: "Registrar nuevos clientes en el sistema." },
    { name: "clients.edit", module: "Clientes", description: "Modificar información existente de clientes." },
    { name: "clients.delete", module: "Clientes", description: "Inactivar o bloquear clientes del sistema." },

    // Pagos
    { name: "payments.register", module: "Pagos", description: "Registrar abonos y liquidaciones de cuotas." },
    { name: "payments.history", module: "Pagos", description: "Consultar el historial completo de pagos recibidos." },

    // Cobranzas
    { name: "collections.view", module: "Cobranzas", description: "Acceder al módulo de gestión de cobros y morosidad." },
    { name: "collections.manage", module: "Cobranzas", description: "Gestionar promesas de pago e intereses por mora." },

    // Préstamos
    { name: "loans.view", module: "Préstamos", description: "Ver todos los préstamos en sus diferentes estados." },
    { name: "loans.create", module: "Préstamos", description: "Crear nuevas solicitudes de préstamo." },
    { name: "loans.approve", module: "Préstamos", description: "Aprobar o rechazar solicitudes pendientes." },
    { name: "loans.disburse", module: "Préstamos", description: "Procesar el desembolso de préstamos aprobados." },
    { name: "loans.annul", module: "Préstamos", description: "Anular préstamos activos o aprobados." },
    { name: "loans.types.manage", module: "Préstamos", description: "Configurar tipos de préstamos, tasas y plazos." },

    // Configuración
    { name: "users.view", module: "Configuración", description: "Ver el listado de usuarios del sistema." },
    { name: "users.manage", module: "Configuración", description: "Crear, editar y dar de baja usuarios." },
    { name: "roles.manage", module: "Configuración", description: "Administrar roles y asignar sus respectivos permisos." }
];

async function main() {
    console.log("🌱 Iniciando siembra de permisos...");

    try {
        for (const permission of permissionsData) {
            await db.insert(permissions)
                .values(permission)
                .onConflictDoUpdate({
                    target: permissions.name,
                    set: {
                        description: permission.description,
                        module: permission.module
                    }
                });
        }
        console.log(`✅ ${permissionsData.length} permisos sembrados/actualizados correctamente.`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Error sembrando permisos:", error);
        process.exit(1);
    }
}

main();
