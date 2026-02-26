import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sesionesCaja, cajas } from '@/lib/db/schema';
import { openSessionSchema } from '@/lib/validations/sesion-caja.schema';
import { eq, and } from 'drizzle-orm';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const sesiones = await db.query.sesionesCaja.findMany({
            where: eq(sesionesCaja.cajaId, id),
            with: {
                user: true,
            },
            orderBy: (sesiones, { desc }) => [desc(sesiones.openedAt)],
        });
        return NextResponse.json(sesiones);
    } catch (error) {
        console.error('Error fetching sesiones:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const json = await request.json();
        const validatedData = openSessionSchema.parse({ ...json, cajaId: id });

        const result = await db.transaction(async (tx) => {
            // Check if the caja exists and is active
            const caja = await tx.query.cajas.findFirst({
                where: and(eq(cajas.id, id), eq(cajas.isActive, true)),
            });

            if (!caja) {
                throw new Error('CAJA_NOT_FOUND');
            }

            // Check if there's already an open session for this caja
            const existingSession = await tx.query.sesionesCaja.findFirst({
                where: and(
                    eq(sesionesCaja.cajaId, id),
                    eq(sesionesCaja.estado, 'abierta'),
                ),
            });

            if (existingSession) {
                throw new Error('SESSION_ALREADY_OPEN');
            }

            // Create new session
            const [newSession] = await tx
                .insert(sesionesCaja)
                .values({
                    cajaId: id,
                    userId: json.userId, // TODO: Get from auth session
                    montoApertura: validatedData.montoApertura.toString(),
                })
                .returning();

            // Update caja saldo to the opening amount
            await tx
                .update(cajas)
                .set({ saldoActual: validatedData.montoApertura.toString() })
                .where(eq(cajas.id, id));

            return newSession;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'CAJA_NOT_FOUND') {
                return NextResponse.json({ error: 'Caja no encontrada o inactiva' }, { status: 404 });
            }
            if (error.message === 'SESSION_ALREADY_OPEN') {
                return NextResponse.json({ error: 'Ya existe una sesión abierta en esta caja' }, { status: 409 });
            }
            if (error.name === 'ZodError') {
                return NextResponse.json({ error: 'Validation Error', details: error }, { status: 400 });
            }
        }
        console.error('Error opening session:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
