import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { movimientosCaja, sesionesCaja, cajas, users } from '@/lib/db/schema';
import { traspasoSchema } from '@/lib/validations/movimiento-caja.schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const validatedData = traspasoSchema.parse(json);

        if (validatedData.cajaOrigenId === validatedData.cajaDestinoId) {
            return NextResponse.json({ error: 'La caja origen y destino no pueden ser la misma' }, { status: 400 });
        }

        // Get userId from body, or fallback to first active user
        let userId = json.userId;
        if (!userId) {
            const firstUser = await db.query.users.findFirst({
                where: eq(users.isActive, true),
            });
            userId = firstUser?.id;
        }

        // Find open sessions for both cajas
        const sessionOrigen = await db.query.sesionesCaja.findFirst({
            where: and(
                eq(sesionesCaja.cajaId, validatedData.cajaOrigenId),
                eq(sesionesCaja.estado, 'abierta'),
            ),
        });

        if (!sessionOrigen) {
            return NextResponse.json({ error: 'No hay sesión abierta en la caja origen' }, { status: 409 });
        }

        const sessionDestino = await db.query.sesionesCaja.findFirst({
            where: and(
                eq(sesionesCaja.cajaId, validatedData.cajaDestinoId),
                eq(sesionesCaja.estado, 'abierta'),
            ),
        });

        if (!sessionDestino) {
            return NextResponse.json({ error: 'No hay sesión abierta en la caja destino' }, { status: 409 });
        }

        // Check if origin caja has enough balance
        const cajaOrigen = await db.query.cajas.findFirst({
            where: eq(cajas.id, validatedData.cajaOrigenId),
        });

        if (!cajaOrigen || Number(cajaOrigen.saldoActual) < validatedData.monto) {
            return NextResponse.json({ error: 'Saldo insuficiente en la caja origen' }, { status: 400 });
        }

        // Create outgoing movement in origin
        const [movSalida] = await db
            .insert(movimientosCaja)
            .values({
                sesionId: sessionOrigen.id,
                cajaId: validatedData.cajaOrigenId,
                tipo: 'traspaso_salida',
                monto: validatedData.monto.toString(),
                concepto: validatedData.concepto,
                createdBy: userId,
            })
            .returning();

        // Create incoming movement in destination
        const [movEntrada] = await db
            .insert(movimientosCaja)
            .values({
                sesionId: sessionDestino.id,
                cajaId: validatedData.cajaDestinoId,
                tipo: 'traspaso_entrada',
                monto: validatedData.monto.toString(),
                concepto: validatedData.concepto,
                createdBy: userId,
            })
            .returning();

        // Update saldos
        await db
            .update(cajas)
            .set({
                saldoActual: (Number(cajaOrigen.saldoActual) - validatedData.monto).toString(),
            })
            .where(eq(cajas.id, validatedData.cajaOrigenId));

        const cajaDestino = await db.query.cajas.findFirst({
            where: eq(cajas.id, validatedData.cajaDestinoId),
        });

        await db
            .update(cajas)
            .set({
                saldoActual: (Number(cajaDestino!.saldoActual) + validatedData.monto).toString(),
            })
            .where(eq(cajas.id, validatedData.cajaDestinoId));

        return NextResponse.json({ movSalida, movEntrada }, { status: 201 });
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json({ error: 'Validation Error', details: error }, { status: 400 });
        }
        console.error('Error processing transfer:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
