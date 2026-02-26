import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clients } from '@/lib/db/schema';
import { clientSchema } from '@/lib/validations/client.schema';
import { eq } from 'drizzle-orm';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const client = await db.query.clients.findFirst({
            where: eq(clients.id, id),
        });

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        return NextResponse.json(client);
    } catch (error) {
        console.error('Error fetching client:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const json = await request.json();
        const validatedData = clientSchema.partial().parse(json);

        const [updatedClient] = await db
            .update(clients)
            .set({
                ...validatedData,
                monthlyIncome: validatedData.monthlyIncome?.toString(),
                creditLimit: validatedData.creditLimit?.toString(),
            })
            .where(eq(clients.id, id))
            .returning();

        if (!updatedClient) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        return NextResponse.json(updatedClient);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json({ error: 'Validation Error', details: error }, { status: 400 });
        }
        console.error('Error updating client:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const [deletedClient] = await db
            .delete(clients)
            .where(eq(clients.id, id))
            .returning();

        if (!deletedClient) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Client deleted successfully' });
    } catch (error) {
        console.error('Error deleting client:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
