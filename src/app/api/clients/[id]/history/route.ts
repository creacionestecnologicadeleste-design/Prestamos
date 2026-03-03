import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clients, loans, payments } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        // Fetch client details
        const client = await db.query.clients.findFirst({
            where: eq(clients.id, id),
        });

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        // Fetch loans associated with client
        const clientLoans = await db
            .select()
            .from(loans)
            .where(eq(loans.clientId, id))
            .orderBy(desc(loans.createdAt));

        // Fetch payments associated with those loans
        const clientPayments = await db
            .select({
                id: payments.id,
                amountPaid: payments.amountPaid,
                paymentDate: payments.paymentDate,
                paymentMethod: payments.paymentMethod,
                referenceNumber: payments.referenceNumber,
                lateFee: payments.lateFee,
                loanId: payments.loanId,
                loan: {
                    loanNumber: loans.loanNumber,
                }
            })
            .from(payments)
            .innerJoin(loans, eq(payments.loanId, loans.id))
            .where(eq(loans.clientId, id))
            .orderBy(desc(payments.paymentDate))
            .limit(50); // Limit to last 50 payments for performance

        // Calculate aggregated stats
        const activeLoansCount = clientLoans.filter(l => l.status === 'active' || l.status === 'approved').length;
        const totalDebt = clientLoans.reduce((sum, loan) =>
            (loan.status === 'active' || loan.status === 'approved') ? sum + Number(loan.amount) : sum, 0
        );
        const totalPaid = clientPayments.reduce((sum, payment) => sum + Number(payment.amountPaid), 0);

        return NextResponse.json({
            client,
            stats: {
                totalLoans: clientLoans.length,
                activeLoansCount,
                totalDebt,
                totalPaid
            },
            loans: clientLoans,
            recentPayments: clientPayments
        });
    } catch (error) {
        console.error('Error fetching client history:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
