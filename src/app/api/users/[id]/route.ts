import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, clients, loans, payments, sesionesCaja, movimientosCaja } from "@/lib/db/schema";
import { updateUserSchema } from "@/lib/validations/user.schema";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const json = await req.json();
        const body = updateUserSchema.parse(json);

        const { name, email, password, roleId, isActive, imageUrl } = body as any;

        const data: any = {
            name,
            email,
            roleId,
            isActive,
            imageUrl,
        };

        if (password) {
            data.passwordHash = await bcrypt.hash(password, 10);
        }

        // Clean undefined values
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

        const updatedUser = await db
            .update(users)
            .set(data)
            .where(eq(users.id, id))
            .returning();

        return NextResponse.json({ ...updatedUser[0] });
    } catch (error) {
        console.error("[USER_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. Check for activity
        const [
            hasClients,
            hasLoans,
            hasPayments,
            hasSessions,
            hasMovements
        ] = await Promise.all([
            db.query.clients.findFirst({ where: eq(clients.createdBy, id) }),
            db.query.loans.findFirst({
                where: or(eq(loans.createdBy, id), eq(loans.approvedBy, id))
            }),
            db.query.payments.findFirst({ where: eq(payments.receivedBy, id) }),
            db.query.sesionesCaja.findFirst({ where: eq(sesionesCaja.userId, id) }),
            db.query.movimientosCaja.findFirst({ where: eq(movimientosCaja.createdBy, id) }),
        ]);

        if (hasClients || hasLoans || hasPayments || hasSessions || hasMovements) {
            return new NextResponse(
                "No se puede eliminar el usuario porque tiene actividad registrada en el sistema (clientes, préstamos, pagos o caja).",
                { status: 400 }
            );
        }

        // 2. Perform hard delete if no activity
        await db.delete(users).where(eq(users.id, id));

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[USER_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
