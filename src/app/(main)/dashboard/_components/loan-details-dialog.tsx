"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    User,
    Calendar,
    Banknote,
    Percent,
    Clock,
    Info,
    Phone,
    Mail,
    MapPin
} from "lucide-react";

interface LoanDetailsDialogProps {
    loan: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const statusMap = {
    pending: { label: "Pendiente", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    approved: { label: "Aprobado", color: "bg-sky-500/10 text-sky-600 border-sky-500/20" },
    active: { label: "Activo", color: "bg-green-500/10 text-green-600 border-green-500/20" },
    paid: { label: "Pagado", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    rejected: { label: "Rechazado", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
    annulled: { label: "Anulado", color: "bg-red-500/10 text-red-600 border-red-500/20" },
};

export function LoanDetailsDialog({ loan, open, onOpenChange }: LoanDetailsDialogProps) {
    if (!loan) return null;

    const status = statusMap[loan.status as keyof typeof statusMap];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="border-b pb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                Préstamo {loan.loanNumber}
                                <Badge className={`${status.color} border ml-2`}>
                                    {status.label}
                                </Badge>
                            </DialogTitle>
                            <DialogDescription className="mt-1">
                                Detalles completos de la operación y el cliente.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Información del Préstamo */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Banknote className="h-4 w-4" /> Datos del Crédito
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <Card className="bg-muted/30 border-none">
                                <CardContent className="p-3">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Monto Principal</p>
                                    <p className="text-lg font-bold text-primary">RD$ {Number(loan.amount).toLocaleString()}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-muted/30 border-none">
                                <CardContent className="p-3">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Tipo de Préstamo</p>
                                    <p className="text-sm font-semibold">{loan.loanType.name}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-muted/30 border-none">
                                <CardContent className="p-3">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Tasa de Interés</p>
                                    <p className="text-lg font-bold flex items-center gap-1">
                                        {loan.interestRate}% <Percent className="h-3 w-3 text-muted-foreground" />
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="bg-muted/30 border-none">
                                <CardContent className="p-3">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Plazo (Cuotas)</p>
                                    <p className="text-lg font-bold flex items-center gap-1">
                                        {loan.termMonths} <Clock className="h-3 w-3 text-muted-foreground" />
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm py-2 border-b border-dashed">
                                <span className="text-muted-foreground flex items-center gap-2 font-medium">
                                    <Calendar className="h-4 w-4" /> Fecha de Solicitud
                                </span>
                                <span className="font-semibold">{new Date(loan.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between text-sm py-2 border-b border-dashed">
                                <span className="text-muted-foreground flex items-center gap-2 font-medium">
                                    <Info className="h-4 w-4" /> Método de Pago
                                </span>
                                <span className="font-semibold capitalize">{loan.paymentMethod || "No especificado"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Información del Cliente */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <User className="h-4 w-4" /> Información del Cliente
                        </h3>
                        <Card className="border-primary/20 bg-primary/5">
                            <CardContent className="p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                                        {loan.client.firstName[0]}{loan.client.lastName[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg leading-none">{loan.client.firstName} {loan.client.lastName}</p>
                                        <p className="text-xs text-muted-foreground mt-1 uppercase tracking-tighter font-mono">ID: {loan.client.id}</p>
                                    </div>
                                </div>
                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span>{loan.client.phone || "Sin teléfono"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span>{loan.client.email || "Sin correo electrónico"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="line-clamp-1">{loan.client.address || "Sin dirección"}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {loan.purpose && (
                    <div className="mt-6 p-4 bg-muted/20 rounded-lg border italic text-sm text-muted-foreground">
                        <p className="font-bold text-xs uppercase not-italic mb-1 text-primary">Propósito del Préstamo:</p>
                        "{loan.purpose}"
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
