import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cajas } from '@/lib/db/schema';
import { createCajaSchema } from '@/lib/validations/caja.schema';
import { eq, ne, and } from 'drizzle-orm';

export async function GET() {
    try {
        const allCajas = await db.query.cajas.findMany({
            where: and(eq(cajas.isActive, true), ne(cajas.tipo, 'bancaria')),
            with: {
                category: true,
                sesiones: {
                    where: (sesiones, { eq }) => eq(sesiones.estado, 'abierta'),
                    with: {
                        user: true,
                    },
                    limit: 1,
                },
            },
            orderBy: (cajas, { asc }) => [asc(cajas.nombre)],
        });
        return NextResponse.json(allCajas);
    } catch (error) {
        console.error('Error fetching cajas:', error);
        if (error instanceof Error) {
            console.error('Stack:', error.stack);
        }
        return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const validatedData = createCajaSchema.parse(json);

        const [newCaja] = await db
            .insert(cajas)
            .values({
                nombre: validatedData.nombre,
                tipo: validatedData.tipo,
                categoryId: validatedData.categoryId,
                cuentaContable: validatedData.cuentaContable,
                limiteMaximo: validatedData.limiteMaximo?.toString(),
                bankName: validatedData.bankName,
                accountNumber: validatedData.accountNumber,
                accountType: validatedData.accountType,
            })
            .returning();

        return NextResponse.json(newCaja, { status: 201 });
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json({ error: 'Validation Error', details: error }, { status: 400 });
        }
        console.error('Error creating caja:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
