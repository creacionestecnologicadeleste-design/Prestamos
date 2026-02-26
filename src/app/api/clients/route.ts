import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clients } from '@/lib/db/schema';
import { clientSchema } from '@/lib/validations/client.schema';

export async function GET() {
    try {
        const allClients = await db.query.clients.findMany({
            orderBy: (clients, { desc }) => [desc(clients.createdAt)],
        });
        return NextResponse.json(allClients);
    } catch (error) {
        console.error('Error fetching clients:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const validatedData = clientSchema.parse(json);

        const [newClient] = await db.insert(clients).values({
            ...validatedData,
            monthlyIncome: validatedData.monthlyIncome?.toString(),
            creditLimit: validatedData.creditLimit?.toString(),
        }).returning();

        return NextResponse.json(newClient, { status: 201 });
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json({ error: 'Validation Error', details: error }, { status: 400 });
        }
        console.error('Error creating client:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
