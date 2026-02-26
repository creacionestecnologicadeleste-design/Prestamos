import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { movimientosCaja, sesionesCaja, cajas } from '@/lib/db/schema';
import { traspasoSchema } from '@/lib/validations/movimiento-caja.schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const validatedData = traspasoSchema.parse(json);

        if (validatedData.cajaOrigenId === validatedData.cajaDestinoId) {
            return NextResponse.json({ error: 'La caja origen y destino no pueden ser la misma' }, { status: 400 });
        }

        const result = await db.transaction(async (tx) => {
            // Find open sessions for both cajas
            const sessionOrigen = await tx.query.sesionesCaja.findFirst({
                where: and(
                    eq(sesionesCaja.cajaId, validatedData.cajaOrigenId),
                    eq(sesionesCaja.estado, 'abierta'),
                ),
            });

            if (!sessionOrigen) {
                throw new Error('NO_OPEN_SESSION_ORIGIN');
            }

            const sessionDestino = await tx.query.sesionesCaja.findFirst({
                where: and(
                    eq(sesionesCaja.cajaId, validatedData.cajaDestinoId),
                    eq(sesionesCaja.estado, 'abierta'),
                ),
            });

            if (!sessionDestino) {
                throw new Error('NO_OPEN_SESSION_DESTINATION');
            }

            // Check if origin caja has enough balance
            const cajaOrigen = await tx.query.cajas.findFirst({
                where: eq(cajas.id, validatedData.cajaOrigenId),
            });

            if (!cajaOrigen || Number(cajaOrigen.saldoActual) < validatedData.monto) {
                throw new Error('INSUFFICIENT_BALANCE');
            }

            // Create outgoing movement in origin
            const [movSalida] = await tx
                .insert(movimientosCaja)
                .values({
                    sesionId: sessionOrigen.id,
                    cajaId: validatedData.cajaOrigenId,
                    tipo: 'traspaso_salida',
                    monto: validatedData.monto.toString(),
                    concepto: validatedData.concepto,
                    createdBy: json.userId,
                })
                .returning();

            // Create incoming movement in destination
            const [movEntrada] = await tx
                .insert(movimientosCaja)
                .values({
                    sesionId: sessionDestino.id,
                    cajaId: validatedData.cajaDestinoId,
                    tipo: 'traspaso_entrada',
                    monto: validatedData.monto.toString(),
                    concepto: validatedData.concepto,
                    createdBy: json.userId,
                })
                .returning();

            // Update saldos
            await tx
                .update(cajas)
                .set({
                    saldoActual: (Number(cajaOrigen.saldoActual) - validatedData.monto).toString(),
                })
                .where(eq(cajas.id, validatedData.cajaOrigenId));

            const cajaDestino = await tx.query.cajas.findFirst({
                where: eq(cajas.id, validatedData.cajaDestinoId),
            });

            await tx
                .update(cajas)
                .set({
                    saldoActual: (Number(cajaDestino!.saldoActual) + validatedData.monto).toString(),
                })
                .where(eq(cajas.id, validatedData.cajaDestinoId));

            return { movSalida, movEntrada };
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'NO_OPEN_SESSION_ORIGIN') {
                return NextResponse.json({ error: 'No hay sesión abierta en la caja origen' }, { status: 409 });
            }
            if (error.message === 'NO_OPEN_SESSION_DESTINATION') {
                return NextResponse.json({ error: 'No hay sesión abierta en la caja destino' }, { status: 409 });
            }
            if (error.message === 'INSUFFICIENT_BALANCE') {
                return NextResponse.json({ error: 'Saldo insuficiente en la caja origen' }, { status: 400 });
            }
            if (error.name === 'ZodError') {
                return NextResponse.json({ error: 'Validation Error', details: error }, { status: 400 });
            }
        }
        console.error('Error processing transfer:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
