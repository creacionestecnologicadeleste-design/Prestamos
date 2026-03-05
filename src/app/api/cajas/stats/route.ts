import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { movimientosCaja, cajas } from '@/lib/db/schema';
import { sql, eq } from 'drizzle-orm';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const cajaId = searchParams.get('cajaId');
        const desde = searchParams.get('desde');
        const hasta = searchParams.get('hasta');

        // Overall stats across all cajas
        const cajasData = await db.query.cajas.findMany({
            where: eq(cajas.isActive, true),
        });

        const totalEnCajas = cajasData.reduce((sum, c) => sum + Number(c.saldoActual), 0);
        const cajasActivas = cajasData.length;

        // Movement stats with optional filters
        const conditions: string[] = [];
        if (cajaId) conditions.push(`caja_id = '${cajaId}'`);
        if (desde) conditions.push(`created_at >= '${desde}'`);
        if (hasta) conditions.push(`created_at <= '${hasta}'`);

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const stats = await db.execute(sql.raw(`
            SELECT 
                COALESCE(SUM(CASE WHEN tipo IN ('ingreso', 'traspaso_entrada', 'ajuste_sobrante') THEN CAST(monto AS DECIMAL) ELSE 0 END), 0) AS total_ingresos,
                COALESCE(SUM(CASE WHEN tipo IN ('gasto', 'traspaso_salida', 'ajuste_faltante') THEN CAST(monto AS DECIMAL) ELSE 0 END), 0) AS total_gastos,
                COUNT(*) AS total_movimientos,
                COUNT(CASE WHEN tipo = 'ingreso' THEN 1 END) AS count_ingresos,
                COUNT(CASE WHEN tipo = 'gasto' THEN 1 END) AS count_gastos,
                COUNT(CASE WHEN tipo IN ('traspaso_entrada', 'traspaso_salida') THEN 1 END) AS count_traspasos
            FROM movimientos_caja
            ${whereClause}
        `));

        const row = (stats as { rows: Record<string, string>[] }).rows?.[0] ?? {};

        return NextResponse.json({
            totalEnCajas,
            cajasActivas,
            totalIngresos: Number(row.total_ingresos ?? 0),
            totalGastos: Number(row.total_gastos ?? 0),
            totalMovimientos: Number(row.total_movimientos ?? 0),
            countIngresos: Number(row.count_ingresos ?? 0),
            countGastos: Number(row.count_gastos ?? 0),
            countTraspasos: Number(row.count_traspasos ?? 0),
            flujoNeto: Number(row.total_ingresos ?? 0) - Number(row.total_gastos ?? 0),
        });
    } catch (error) {
        console.error('Error fetching caja stats:', error);
        if (error instanceof Error) {
            console.error('Stack:', error.stack);
        }
        return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
