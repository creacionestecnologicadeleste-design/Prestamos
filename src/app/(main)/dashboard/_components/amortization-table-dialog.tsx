"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    ReceiptText,
    Calendar,
    CircleDollarSign,
    Scale,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AmortizationTableDialogProps {
    loanId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const statusMap = {
    pending: { label: "Pendiente", icon: Clock, color: "text-amber-500 bg-amber-50" },
    paid: { label: "Pagado", icon: CheckCircle2, color: "text-green-500 bg-green-50" },
    overdue: { label: "Atrasado", icon: AlertTriangle, color: "text-red-500 bg-red-50" },
    partial: { label: "Parcial", icon: Clock, color: "text-blue-500 bg-blue-50" },
};

export function AmortizationTableDialog({ loanId, open, onOpenChange }: AmortizationTableDialogProps) {
    const { data: loan, isLoading } = useQuery({
        queryKey: ["loan", loanId],
        queryFn: async () => {
            if (!loanId) return null;
            const { data } = await axios.get(`/api/loans/${loanId}`);
            return data;
        },
        enabled: !!loanId && open,
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[1000px] w-[60vw] max-w-[calc(100%-1rem)] p-0 overflow-hidden border-none shadow-2xl bg-card/95 backdrop-blur-xl transition-all duration-300">
                <DialogHeader className="p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
                            <ReceiptText className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-bold tracking-tight">
                                Tabla de Amortización
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground font-medium italic">
                                {loan ? `Préstamo ${loan.loanNumber} • ${loan.client.firstName} ${loan.client.lastName}` : "Detalle de cuotas y saldos."}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6">
                    {isLoading ? (
                        <div className="h-[400px] flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
                        </div>
                    ) : loan ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <CardSimple
                                    icon={CircleDollarSign}
                                    label="Monto Original"
                                    value={`RD$ ${Number(loan.amount).toLocaleString()}`}
                                    color="text-primary"
                                />
                                <CardSimple
                                    icon={Scale}
                                    label="Interés Anual"
                                    value={`${loan.interestRate}%`}
                                    color="text-blue-600"
                                />
                                <CardSimple
                                    icon={Calendar}
                                    label="Plazo"
                                    value={`${loan.termMonths} Meses`}
                                    color="text-indigo-600"
                                />
                            </div>

                            {/* Table */}
                            <div className="rounded-2xl border shadow-sm overflow-hidden bg-background/50">
                                <ScrollArea className="h-[450px]" scrollHideDelay={0}>
                                    <div className="min-w-full overflow-x-auto">
                                        <Table className="w-full table-fixed md:table-auto">
                                            <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                                                <TableRow>
                                                    <TableHead className="w-12 text-center py-4">#</TableHead>
                                                    <TableHead className="w-[120px]">Fecha</TableHead>
                                                    <TableHead className="w-[120px]">Capital</TableHead>
                                                    <TableHead className="w-[120px]">Interés</TableHead>
                                                    <TableHead className="w-[140px] font-bold text-primary">Total Cuota</TableHead>
                                                    <TableHead className="w-[140px]">Saldo Restante</TableHead>
                                                    <TableHead className="">Estado</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {loan.schedule
                                                    .sort((a: any, b: any) => a.installmentNumber - b.installmentNumber)
                                                    .map((item: any) => {
                                                        const status = statusMap[item.status as keyof typeof statusMap] || statusMap.pending;
                                                        const StatusIcon = status.icon;

                                                        return (
                                                            <TableRow key={item.id} className="hover:bg-primary/5 transition-colors group">
                                                                <TableCell className="text-center font-mono text-xs font-bold text-muted-foreground group-hover:text-primary">
                                                                    {item.installmentNumber}
                                                                </TableCell>
                                                                <TableCell className="text-xs font-medium">
                                                                    {new Date(item.dueDate).toLocaleDateString("es-DO", {
                                                                        day: '2-digit',
                                                                        month: 'short',
                                                                        year: 'numeric'
                                                                    })}
                                                                </TableCell>
                                                                <TableCell className="text-xs font-semibold">
                                                                    RD$ {Number(item.principalAmount).toLocaleString()}
                                                                </TableCell>
                                                                <TableCell className="text-xs">
                                                                    RD$ {Number(item.interestAmount).toLocaleString()}
                                                                </TableCell>
                                                                <TableCell className="font-bold text-sm text-primary">
                                                                    RD$ {Number(item.totalAmount).toLocaleString()}
                                                                </TableCell>
                                                                <TableCell className="font-mono text-xs text-muted-foreground">
                                                                    RD$ {Number(item.remainingBalance).toLocaleString()}
                                                                </TableCell>
                                                                <TableCell className="">
                                                                    <div className={cn(
                                                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border animate-in zoom-in-95 duration-300",
                                                                        status.color
                                                                    )}>
                                                                        <StatusIcon className="h-3 w-3" />
                                                                        {status.label}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    ) : (
                        <div className="h-[400px] flex items-center justify-center text-muted-foreground italic">
                            No se pudo cargar la información del préstamo.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function CardSimple({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
    return (
        <div className="p-3.5 rounded-xl bg-muted/30 border shadow-sm group hover:bg-muted/50 transition-all duration-300">
            <div className="flex items-center gap-3.5 overflow-hidden">
                <div className={cn("p-2 rounded-lg bg-white dark:bg-slate-900 shadow-sm transition-transform group-hover:scale-110 shrink-0", color)}>
                    <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-tight mb-0.5">{label}</p>
                    <p className={cn("text-xl font-black tracking-tight leading-none", color)}>{value}</p>
                </div>
            </div>
        </div>
    );
}
