import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sesionesCaja, cajas, users } from '@/lib/db/schema';
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

        // Get userId from body, or fallback to first active user
        let userId = json.userId;
        if (!userId) {
            const firstUser = await db.query.users.findFirst({
                where: eq(users.isActive, true),
            });
            userId = firstUser?.id;
        }

        if (!userId) {
            return NextResponse.json({ error: 'No se encontró usuario' }, { status: 400 });
        }

        // Check if the caja exists and is active
        const caja = await db.query.cajas.findFirst({
            where: and(eq(cajas.id, id), eq(cajas.isActive, true)),
        });

        if (!caja) {
            return NextResponse.json({ error: 'Caja no encontrada o inactiva' }, { status: 404 });
        }

        // Check if there's already an open session for this caja
        const existingSession = await db.query.sesionesCaja.findFirst({
            where: and(
                eq(sesionesCaja.cajaId, id),
                eq(sesionesCaja.estado, 'abierta'),
            ),
        });

        if (existingSession) {
            return NextResponse.json({ error: 'Ya existe una sesión abierta en esta caja' }, { status: 409 });
        }

        // Create new session
        const [newSession] = await db
            .insert(sesionesCaja)
            .values({
                cajaId: id,
                userId,
                montoApertura: validatedData.montoApertura.toString(),
            })
            .returning();

        // Update caja saldo to the opening amount
        await db
            .update(cajas)
            .set({ saldoActual: validatedData.montoApertura.toString() })
            .where(eq(cajas.id, id));

        return NextResponse.json(newSession, { status: 201 });
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json({ error: 'Validation Error', details: error }, { status: 400 });
        }
        console.error('Error opening session:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
