import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sesionesCaja, movimientosCaja, cajas } from '@/lib/db/schema';
import { closeSessionSchema } from '@/lib/validations/sesion-caja.schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string; sesionId: string }> },
) {
    try {
        const { sesionId } = await params;
        const sesion = await db.query.sesionesCaja.findFirst({
            where: eq(sesionesCaja.id, sesionId),
            with: {
                user: true,
                caja: true,
                movimientos: {
                    orderBy: (mov, { desc }) => [desc(mov.createdAt)],
                    with: {
                        creator: true,
                    },
                },
            },
        });

        if (!sesion) {
            return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
        }

        return NextResponse.json(sesion);
    } catch (error) {
        console.error('Error fetching sesion:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string; sesionId: string }> },
) {
    try {
        const { id, sesionId } = await params;
        const json = await request.json();
        const validatedData = closeSessionSchema.parse(json);

        const result = await db.transaction(async (tx) => {
            // Get the session
            const sesion = await tx.query.sesionesCaja.findFirst({
                where: and(
                    eq(sesionesCaja.id, sesionId),
                    eq(sesionesCaja.estado, 'abierta'),
                ),
            });

            if (!sesion) {
                throw new Error('SESSION_NOT_FOUND_OR_CLOSED');
            }

            // Calculate expected balance:
            // monto_apertura + SUM(ingresos + traspaso_entrada + ajuste_sobrante) - SUM(gastos + traspaso_salida + ajuste_faltante)
            const [movementSums] = await tx
                .select({
                    totalIngresos: sql<string>`COALESCE(SUM(CASE WHEN tipo IN ('ingreso', 'traspaso_entrada', 'ajuste_sobrante') THEN monto ELSE 0 END), 0)`,
                    totalGastos: sql<string>`COALESCE(SUM(CASE WHEN tipo IN ('gasto', 'traspaso_salida', 'ajuste_faltante') THEN monto ELSE 0 END), 0)`,
                })
                .from(movimientosCaja)
                .where(eq(movimientosCaja.sesionId, sesionId));

            const montoApertura = Number(sesion.montoApertura);
            const totalIngresos = Number(movementSums.totalIngresos);
            const totalGastos = Number(movementSums.totalGastos);
            const saldoEsperado = montoApertura + totalIngresos - totalGastos;
            const montoCierre = validatedData.montoCierre;
            const discrepancia = montoCierre - saldoEsperado;

            // Close the session
            const [closedSession] = await tx
                .update(sesionesCaja)
                .set({
                    montoCierre: montoCierre.toString(),
                    saldoEsperado: saldoEsperado.toString(),
                    discrepancia: discrepancia.toString(),
                    estado: 'cerrada',
                    closedAt: new Date(),
                })
                .where(eq(sesionesCaja.id, sesionId))
                .returning();

            // If there's a discrepancy, create an adjustment movement
            if (discrepancia !== 0) {
                await tx.insert(movimientosCaja).values({
                    sesionId: sesionId,
                    cajaId: id,
                    tipo: discrepancia > 0 ? 'ajuste_sobrante' : 'ajuste_faltante',
                    monto: Math.abs(discrepancia).toString(),
                    concepto: discrepancia > 0
                        ? `Ajuste por sobrante de caja: +${Math.abs(discrepancia).toFixed(2)}`
                        : `Ajuste por faltante de caja: -${Math.abs(discrepancia).toFixed(2)}`,
                });
            }

            // Update the caja's saldo_actual to the physical count (monto_cierre)
            await tx
                .update(cajas)
                .set({ saldoActual: montoCierre.toString() })
                .where(eq(cajas.id, id));

            return {
                ...closedSession,
                totalIngresos,
                totalGastos,
                saldoEsperado,
                discrepancia,
            };
        });

        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'SESSION_NOT_FOUND_OR_CLOSED') {
                return NextResponse.json({ error: 'Sesión no encontrada o ya cerrada' }, { status: 404 });
            }
            if (error.name === 'ZodError') {
                return NextResponse.json({ error: 'Validation Error', details: error }, { status: 400 });
            }
        }
        console.error('Error closing session:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
