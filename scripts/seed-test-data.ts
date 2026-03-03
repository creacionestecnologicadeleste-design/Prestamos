import { config } from "dotenv";
config({ path: ".env.local" }); // or .env if preferred
config({ path: ".env" }); // fallback

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { clients, loans, loanTypes, amortizationSchedule, payments, penalties } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function main() {
    console.log("🌱 Iniciando semilla de datos de prueba en Neon (Postgres)...");

    try {
        // 1. Ensure we have at least one loan type
        let personalLoanType = await db.select().from(loanTypes).where(eq(loanTypes.name, "Préstamo Personal")).limit(1);
        let loanTypeId = personalLoanType[0]?.id;

        if (!loanTypeId) {
            console.log("Creando tipo de préstamo 'Préstamo Personal'...");
            const newType = await db.insert(loanTypes).values({
                name: "Préstamo Personal",
                description: "Para uso personal general",
                interestRateDefault: "5.00",
                isActive: true
            }).returning({ id: loanTypes.id });
            loanTypeId = newType[0].id;
        }

        // 2. Define 5 test clients with different scenarios
        const testClients = [
            {
                firstName: "María",
                lastName: "Gómez",
                cedula: "001-1234567-1",
                phone: "809-555-0101",
                email: "maria.gomez@email.com",
                address: "Ensanche Piantini, Santo Domingo",
                status: "active" as const,
                scenario: "Excelente pagadora, adelanta pagos."
            },
            {
                firstName: "Carlos",
                lastName: "Rodríguez",
                cedula: "001-7654321-2",
                phone: "829-555-0202",
                email: "carlos.r@email.com",
                address: "Los Cacicazgos, Santo Domingo",
                status: "active" as const,
                scenario: "Cliente nuevo, pagos al día reciente."
            },
            {
                firstName: "Ana",
                lastName: "Martínez",
                cedula: "031-1122334-3",
                phone: "809-555-0303",
                email: "ana.m@email.com",
                address: "Bella Vista, Santiago",
                status: "defaulted" as const,
                scenario: "Cliente morosa, tiene cuotas atrasadas por más de 30 días con penalidades."
            },
            {
                firstName: "José",
                lastName: "Pérez",
                cedula: "047-9988776-4",
                phone: "849-555-0404",
                email: "jose.perez@email.com",
                address: "Gazcue, Santo Domingo",
                status: "active" as const,
                scenario: "Cliente recurrente, 1 préstamo pagado, 1 préstamo activo a 90 días."
            },
            {
                firstName: "Laura",
                lastName: "Sánchez",
                cedula: "001-5544332-5",
                phone: "829-555-0505",
                email: "laura.s@email.com",
                address: "La Romana",
                status: "blocked" as const,
                scenario: "Cliente bloqueado por mal comportamiento histórico."
            }
        ];

        console.log("Creando 5 clientes de prueba...");
        const createdClients = [];
        for (const c of testClients) {
            // Upsert or insert (re-running this script will fail if cedula exists)
            // Just inserting carefully or allowing failure
            try {
                const result = await db.insert(clients).values({
                    firstName: c.firstName,
                    lastName: c.lastName,
                    cedula: c.cedula,
                    phone: c.phone,
                    email: c.email,
                    address: c.address,
                    status: c.status,
                    createdAt: new Date()
                }).returning({ id: clients.id });
                createdClients.push({ ...c, id: result[0].id });
            } catch (e) {
                // If exists, fetch it
                const existing = await db.select().from(clients).where(eq(clients.cedula, c.cedula));
                createdClients.push({ ...c, id: existing[0].id });
            }
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Helpers to create schedules
        const getDates = (startDate: Date, months: number) => {
            let dates = [];
            for (let i = 1; i <= months; i++) {
                let d = new Date(startDate);
                d.setMonth(d.getMonth() + i);
                dates.push(d.toISOString().split('T')[0]);
            }
            return dates;
        };

        console.log("Generando préstamos y escenarios...");

        // Scenario 1: María Gómez (Excellent, active)
        let maria = createdClients[0];
        try {
            let mariaLoan = await db.insert(loans).values({
                clientId: maria.id,
                loanTypeId,
                loanNumber: `LN-${Date.now().toString().slice(-6)}-MA`,
                amount: "50000",
                interestRate: "5.00",
                termMonths: 6,
                paymentFrequency: "monthly",
                status: "active",
                createdAt: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000) // 3 months ago
            }).returning({ id: loans.id });

            let mDates = getDates(new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000), 6);
            let mShare = 50000 / 6;
            let mInt = 50000 * 0.05;

            for (let i = 0; i < 6; i++) {
                let schedStatus = i < 3 ? 'paid' : 'pending'; // Paid first 3 months
                let sched = await db.insert(amortizationSchedule).values({
                    loanId: mariaLoan[0].id,
                    installmentNumber: i + 1,
                    dueDate: mDates[i],
                    principalAmount: mShare.toFixed(2),
                    interestAmount: mInt.toFixed(2),
                    totalAmount: (mShare + mInt).toFixed(2),
                    remainingBalance: (50000 - (mShare * (i + 1))).toFixed(2),
                    status: schedStatus as any
                }).returning({ id: amortizationSchedule.id });

                if (schedStatus === 'paid') {
                    await db.insert(payments).values({
                        loanId: mariaLoan[0].id,
                        scheduleId: sched[0].id,
                        amountPaid: (mShare + mInt).toFixed(2),
                        paymentDate: new Date(mDates[i]),
                        paymentMethod: 'transfer',
                        referenceNumber: `TRF-MA-${i}`,
                        notes: "Pago puntual"
                    });
                }
            }
        } catch (e) { console.log("Skipping Maria, probably exists."); }

        // Scenario 2: Carlos Rodríguez (New, active)
        let carlos = createdClients[1];
        try {
            let carlosLoan = await db.insert(loans).values({
                clientId: carlos.id,
                loanTypeId,
                loanNumber: `LN-${Date.now().toString().slice(-6)}-CA`,
                amount: "100000",
                interestRate: "4.50",
                termMonths: 12,
                paymentFrequency: "monthly",
                status: "active",
                createdAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
            }).returning({ id: loans.id });

            let cDates = getDates(new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000), 12);
            let cShare = 100000 / 12;
            let cInt = 100000 * 0.045;

            for (let i = 0; i < 12; i++) {
                await db.insert(amortizationSchedule).values({
                    loanId: carlosLoan[0].id,
                    installmentNumber: i + 1,
                    dueDate: cDates[i],
                    principalAmount: cShare.toFixed(2),
                    interestAmount: cInt.toFixed(2),
                    totalAmount: (cShare + cInt).toFixed(2),
                    remainingBalance: (100000 - (cShare * (i + 1))).toFixed(2),
                    status: 'pending'
                });
            }
        } catch (e) { console.log("Skipping Carlos."); }

        // Scenario 3: Ana Martínez (Defaulted, Overdue > 30 days)
        let ana = createdClients[2];
        try {
            let anaLoan = await db.insert(loans).values({
                clientId: ana.id,
                loanTypeId,
                loanNumber: `LN-${Date.now().toString().slice(-6)}-AN`,
                amount: "25000",
                interestRate: "6.00",
                termMonths: 6,
                paymentFrequency: "monthly",
                status: "active", // The loan is active, but client/installments are defaulted
                createdAt: new Date(today.getTime() - 150 * 24 * 60 * 60 * 1000) // 5 months ago
            }).returning({ id: loans.id });

            let aDates = getDates(new Date(today.getTime() - 150 * 24 * 60 * 60 * 1000), 6);
            let aShare = 25000 / 6;
            let aInt = 25000 * 0.06;

            for (let i = 0; i < 6; i++) {
                // First 2 paid, next 2 overdue, last 2 pending future
                let schedStatus = i < 2 ? 'paid' : (i < 4 ? 'pending' : 'pending');
                let sched = await db.insert(amortizationSchedule).values({
                    loanId: anaLoan[0].id,
                    installmentNumber: i + 1,
                    dueDate: aDates[i],
                    principalAmount: aShare.toFixed(2),
                    interestAmount: aInt.toFixed(2),
                    totalAmount: (aShare + aInt).toFixed(2),
                    remainingBalance: (25000 - (aShare * (i + 1))).toFixed(2),
                    status: schedStatus as any
                }).returning({ id: amortizationSchedule.id });

                if (schedStatus === 'paid') {
                    await db.insert(payments).values({
                        loanId: anaLoan[0].id,
                        scheduleId: sched[0].id,
                        amountPaid: (aShare + aInt).toFixed(2),
                        paymentDate: new Date(aDates[i]),
                        paymentMethod: 'cash',
                        notes: "Pago en ventanilla"
                    });
                }

                // Add penalties for the overdue ones (i = 2, i = 3 are overdue because they are in the past)
                if (i >= 2 && i < 4) {
                    await db.insert(penalties).values({
                        loanId: anaLoan[0].id,
                        scheduleId: sched[0].id,
                        penaltyAmount: "500.00",
                        penaltyRate: "5.00",
                        daysOverdue: 45, // Fake days overdue
                        isPaid: false,
                        createdAt: new Date(new Date(aDates[i]).getTime() + 5 * 24 * 60 * 60 * 1000) // applied 5 days after due
                    });
                }
            }
        } catch (e) { console.log("Skipping Ana."); }

        // Scenario 4: José Pérez (Recurrent, one paid off, one active)
        let jose = createdClients[3];
        try {
            // Paid off loan
            let joseOldLoan = await db.insert(loans).values({
                clientId: jose.id,
                loanTypeId,
                loanNumber: `LN-${Date.now().toString().slice(-6)}-JO1`,
                amount: "15000",
                interestRate: "5.00",
                termMonths: 3,
                paymentFrequency: "monthly",
                status: "paid",
                createdAt: new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000) // 1 year ago
            }).returning({ id: loans.id });

            let joDates = getDates(new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000), 3);
            for (let i = 0; i < 3; i++) {
                let sched = await db.insert(amortizationSchedule).values({
                    loanId: joseOldLoan[0].id,
                    installmentNumber: i + 1,
                    dueDate: joDates[i],
                    principalAmount: "5000",
                    interestAmount: "750",
                    totalAmount: "5750",
                    remainingBalance: (15000 - (5000 * (i + 1))).toFixed(2),
                    status: 'paid'
                }).returning({ id: amortizationSchedule.id });
                await db.insert(payments).values({
                    loanId: joseOldLoan[0].id,
                    scheduleId: sched[0].id,
                    amountPaid: "5750",
                    paymentDate: new Date(joDates[i]),
                    paymentMethod: 'transfer'
                });
            }

            // Active loan (Weekly)
            let joseActiveLoan = await db.insert(loans).values({
                clientId: jose.id,
                loanTypeId,
                loanNumber: `LN-${Date.now().toString().slice(-6)}-JO2`,
                amount: "20000",
                interestRate: "2.00",
                termMonths: 1, // 4 weeks
                paymentFrequency: "weekly",
                status: "active",
                createdAt: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000) // 2 weeks ago
            }).returning({ id: loans.id });

            // 4 weekly dates
            let jwDates = [];
            for (let i = 1; i <= 4; i++) {
                let d = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
                d.setDate(d.getDate() + (i * 7));
                jwDates.push(d.toISOString().split('T')[0]);
            }

            for (let i = 0; i < 4; i++) {
                let isPast = new Date(jwDates[i]) < today;
                let sched = await db.insert(amortizationSchedule).values({
                    loanId: joseActiveLoan[0].id,
                    installmentNumber: i + 1,
                    dueDate: jwDates[i],
                    principalAmount: "5000",
                    interestAmount: "400",
                    totalAmount: "5400",
                    remainingBalance: (20000 - (5000 * (i + 1))).toFixed(2),
                    status: isPast ? 'paid' : 'pending'
                }).returning({ id: amortizationSchedule.id });

                if (isPast) {
                    await db.insert(payments).values({
                        loanId: joseActiveLoan[0].id,
                        scheduleId: sched[0].id,
                        amountPaid: "5400",
                        paymentDate: new Date(jwDates[i]),
                        paymentMethod: 'cash'
                    });
                }
            }
        } catch (e) { console.log("Skipping Jose."); }

        // Scenario 5: Laura Sánchez (Blocked, rejected loan)
        let laura = createdClients[4];
        try {
            await db.insert(loans).values({
                clientId: laura.id,
                loanTypeId,
                loanNumber: `LN-${Date.now().toString().slice(-6)}-LA`,
                amount: "500000",
                interestRate: "8.00",
                termMonths: 24,
                paymentFrequency: "monthly",
                status: "rejected",
                createdAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
            });
        } catch (e) { console.log("Skipping Laura."); }

        console.log("✅ Datos de prueba sembrados exitosamente.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error sembrando datos:", error);
        process.exit(1);
    }
}

main();
