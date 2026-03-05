import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cajas } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkPermission } from "@/lib/permissions";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const hasPermission = await checkPermission("cajas.view");
        if (!hasPermission) return new NextResponse("Forbidden", { status: 403 });

        const banks = await db.query.cajas.findMany({
            where: eq(cajas.isActive, true),
            with: {
                category: true,
                sesiones: {
                    where: (sesiones, { eq }) => eq(sesiones.estado, 'abierta'),
                    limit: 1,
                },
            },
            orderBy: (cajas, { asc }) => [asc(cajas.nombre)],
        });

        const bankAccounts = banks.filter(b => b.tipo === 'bancaria' || b.category?.icon === 'bank');

        return NextResponse.json(bankAccounts);
    } catch (error) {
        console.error('Error fetching banks:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
