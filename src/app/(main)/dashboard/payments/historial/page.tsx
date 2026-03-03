"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
    History,
    Search,
    Filter,
    Calendar,
    User,
    Banknote,
    Tag
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function PaymentHistoryPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const { data: payments = [], isLoading } = useQuery({
        queryKey: ["payment-history"],
        queryFn: async () => {
            const { data } = await axios.get("/api/payments/history");
            return data;
        },
    });

    const filteredPayments = payments.filter((payment: any) =>
        payment.loan.loanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${payment.client.firstName} ${payment.client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.referenceNumber && payment.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const methodMap: Record<string, { label: string, color: string }> = {
        cash: { label: "Efectivo", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
        transfer: { label: "Transferencia", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
        card: { label: "Tarjeta", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
        check: { label: "Cheque", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" }
    };

    return (
        <div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <History className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Historial de Pagos</h1>
                        <p className="text-muted-foreground italic">Registro completo de todos los cobros recibidos.</p>
                    </div>
                </div>
            </div>

            <Card className="border-none shadow-xl bg-card/60 backdrop-blur-md overflow-hidden">
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Últimos Pagos Registrados</CardTitle>
                            <CardDescription>Visualice los cobros organizados por fecha reciente.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por préstamo, cliente o referencia..."
                                    className="pl-9 w-[320px] bg-background/50 focus-visible:ring-primary"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 border-b">
                                <TableHead className="font-bold py-4">Fecha / Ref.</TableHead>
                                <TableHead className="font-bold">Cliente</TableHead>
                                <TableHead className="font-bold">Préstamo</TableHead>
                                <TableHead className="font-bold text-center">Método</TableHead>
                                <TableHead className="font-bold text-right">Mora Cobrada</TableHead>
                                <TableHead className="font-bold text-right">Monto Pagado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">Cargando historial...</TableCell>
                                </TableRow>
                            ) : filteredPayments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">No se encontraron pagos registrados.</TableCell>
                                </TableRow>
                            ) : filteredPayments.map((payment: any) => {
                                const method = methodMap[payment.paymentMethod] || { label: payment.paymentMethod, color: "bg-gray-100" };
                                return (
                                    <TableRow key={payment.id} className="group hover:bg-blue-500/5 transition-all">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(payment.paymentDate).toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' })}
                                                </span>
                                                {payment.referenceNumber && (
                                                    <span className="text-[10px] text-muted-foreground mt-0.5 uppercase flex items-center gap-1">
                                                        <Tag className="h-2 w-2" /> Ref: {payment.referenceNumber}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm">{payment.client.firstName} {payment.client.lastName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-mono text-xs font-bold py-4">{payment.loan.loanNumber}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={`${method.color} border font-bold px-2.5 py-0.5 text-[10px] shadow-sm`}>
                                                {method.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-red-600 font-medium">
                                            {Number(payment.lateFee) > 0 ? `RD$ ${Number(payment.lateFee).toLocaleString()}` : "-"}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-sm text-blue-600">
                                            RD$ {Number(payment.amountPaid).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
