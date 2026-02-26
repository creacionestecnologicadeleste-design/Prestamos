import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cajas } from '@/lib/db/schema';
import { updateCajaSchema } from '@/lib/validations/caja.schema';
import { eq } from 'drizzle-orm';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const caja = await db.query.cajas.findFirst({
            where: eq(cajas.id, id),
            with: {
                sesiones: {
                    with: {
                        user: true,
                        movimientos: {
                            orderBy: (mov, { desc }) => [desc(mov.createdAt)],
                        },
                    },
                    orderBy: (sesiones, { desc }) => [desc(sesiones.openedAt)],
                    limit: 10,
                },
            },
        });

        if (!caja) {
            return NextResponse.json({ error: 'Caja no encontrada' }, { status: 404 });
        }

        return NextResponse.json(caja);
    } catch (error) {
        console.error('Error fetching caja:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const json = await request.json();
        const validatedData = updateCajaSchema.parse(json);

        const [updated] = await db
            .update(cajas)
            .set({
                ...(validatedData.nombre && { nombre: validatedData.nombre }),
                ...(validatedData.tipo && { tipo: validatedData.tipo }),
                ...(validatedData.cuentaContable !== undefined && { cuentaContable: validatedData.cuentaContable }),
                ...(validatedData.limiteMaximo !== undefined && { limiteMaximo: validatedData.limiteMaximo?.toString() }),
            })
            .where(eq(cajas.id, id))
            .returning();

        if (!updated) {
            return NextResponse.json({ error: 'Caja no encontrada' }, { status: 404 });
        }

        return NextResponse.json(updated);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json({ error: 'Validation Error', details: error }, { status: 400 });
        }
        console.error('Error updating caja:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const [deactivated] = await db
            .update(cajas)
            .set({ isActive: false })
            .where(eq(cajas.id, id))
            .returning();

        if (!deactivated) {
            return NextResponse.json({ error: 'Caja no encontrada' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Caja desactivada exitosamente' });
    } catch (error) {
        console.error('Error deactivating caja:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
