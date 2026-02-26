import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { movimientosCaja, sesionesCaja, cajas } from '@/lib/db/schema';
import { movimientoSchema } from '@/lib/validations/movimiento-caja.schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string; sesionId: string }> },
) {
    try {
        const { sesionId } = await params;
        const movimientos = await db.query.movimientosCaja.findMany({
            where: eq(movimientosCaja.sesionId, sesionId),
            with: {
                creator: true,
            },
            orderBy: (mov, { desc }) => [desc(mov.createdAt)],
        });
        return NextResponse.json(movimientos);
    } catch (error) {
        console.error('Error fetching movimientos:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string; sesionId: string }> },
) {
    try {
        const { id, sesionId } = await params;
        const json = await request.json();
        const validatedData = movimientoSchema.parse(json);

        const result = await db.transaction(async (tx) => {
            // Verify the session is open
            const sesion = await tx.query.sesionesCaja.findFirst({
                where: and(
                    eq(sesionesCaja.id, sesionId),
                    eq(sesionesCaja.estado, 'abierta'),
                ),
            });

            if (!sesion) {
                throw new Error('SESSION_NOT_OPEN');
            }

            // Create the movement
            const [newMovimiento] = await tx
                .insert(movimientosCaja)
                .values({
                    sesionId,
                    cajaId: id,
                    tipo: validatedData.tipo,
                    monto: validatedData.monto.toString(),
                    concepto: validatedData.concepto,
                    referencia: validatedData.referencia,
                    createdBy: json.userId, // TODO: Get from auth session
                })
                .returning();

            // Update saldo_actual on the caja
            const caja = await tx.query.cajas.findFirst({
                where: eq(cajas.id, id),
            });

            if (!caja) {
                throw new Error('CAJA_NOT_FOUND');
            }

            const currentSaldo = Number(caja.saldoActual);
            const nuevoSaldo = validatedData.tipo === 'ingreso'
                ? currentSaldo + validatedData.monto
                : currentSaldo - validatedData.monto;

            await tx
                .update(cajas)
                .set({ saldoActual: nuevoSaldo.toString() })
                .where(eq(cajas.id, id));

            return newMovimiento;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'SESSION_NOT_OPEN') {
                return NextResponse.json({ error: 'La sesión no está abierta' }, { status: 409 });
            }
            if (error.message === 'CAJA_NOT_FOUND') {
                return NextResponse.json({ error: 'Caja no encontrada' }, { status: 404 });
            }
            if (error.name === 'ZodError') {
                return NextResponse.json({ error: 'Validation Error', details: error }, { status: 400 });
            }
        }
        console.error('Error creating movimiento:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
