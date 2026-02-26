import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { movimientosCaja, sesionesCaja, cajas, users } from '@/lib/db/schema';
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

        // Get userId from body, or fallback to first active user
        let userId = json.userId;
        if (!userId) {
            const firstUser = await db.query.users.findFirst({
                where: eq(users.isActive, true),
            });
            userId = firstUser?.id;
        }

        // Verify the session is open
        const sesion = await db.query.sesionesCaja.findFirst({
            where: and(
                eq(sesionesCaja.id, sesionId),
                eq(sesionesCaja.estado, 'abierta'),
            ),
        });

        if (!sesion) {
            return NextResponse.json({ error: 'La sesión no está abierta' }, { status: 409 });
        }

        // Create the movement
        const [newMovimiento] = await db
            .insert(movimientosCaja)
            .values({
                sesionId,
                cajaId: id,
                tipo: validatedData.tipo,
                monto: validatedData.monto.toString(),
                concepto: validatedData.concepto,
                referencia: validatedData.referencia,
                createdBy: userId,
            })
            .returning();

        // Update saldo_actual on the caja
        const caja = await db.query.cajas.findFirst({
            where: eq(cajas.id, id),
        });

        if (!caja) {
            return NextResponse.json({ error: 'Caja no encontrada' }, { status: 404 });
        }

        const currentSaldo = Number(caja.saldoActual);
        const nuevoSaldo = validatedData.tipo === 'ingreso'
            ? currentSaldo + validatedData.monto
            : currentSaldo - validatedData.monto;

        await db
            .update(cajas)
            .set({ saldoActual: nuevoSaldo.toString() })
            .where(eq(cajas.id, id));

        return NextResponse.json(newMovimiento, { status: 201 });
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json({ error: 'Validation Error', details: error }, { status: 400 });
        }
        console.error('Error creating movimiento:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
