"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
    ReceiptText,
    Search,
    Filter,
    CreditCard,
    User,
    Calendar,
    Loader2
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function RegisterPaymentPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLoan, setSelectedLoan] = useState<any>(null);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    const { data: loans = [], isLoading } = useQuery({
        queryKey: ["active-loans"],
        queryFn: async () => {
            const { data } = await axios.get("/api/reports/portfolio");
            return data.loans || [];
        },
    });

    const paymentMutation = useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await axios.post("/api/payments", payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["active-loans"] });
            toast.success("Pago registrado correctamente");
            setIsPaymentOpen(false);
            setSelectedLoan(null);
        },
        onError: () => {
            toast.error("Error al registrar el pago");
        }
    });

    const filteredLoans = loans.filter((loan: any) =>
        loan.loanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${loan.client.firstName} ${loan.client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenPayment = (loan: any) => {
        setSelectedLoan(loan);
        setIsPaymentOpen(true);
    };

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <ReceiptText className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Registro de Pagos</h1>
                            <p className="text-muted-foreground italic">Seleccione un crédito activo para aplicar el pago.</p>
                        </div>
                    </div>
                </div>

                <Card className="border-none shadow-xl bg-card/60 backdrop-blur-md overflow-hidden">
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Cartera Activa</CardTitle>
                                <CardDescription>Créditos con cuotas pendientes de cobro.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar por número o cliente..."
                                        className="pl-9 w-[280px] bg-background/50 focus-visible:ring-primary"
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
                                    <TableHead className="w-[120px] font-bold py-4">Nº Préstamo</TableHead>
                                    <TableHead className="font-bold">Cliente</TableHead>
                                    <TableHead className="font-bold">Monto Restante</TableHead>
                                    <TableHead className="font-bold text-center">Cuota Actual</TableHead>
                                    <TableHead className="w-[150px] text-center font-bold">Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">Cargando créditos...</TableCell>
                                    </TableRow>
                                ) : filteredLoans.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">No se encontraron créditos activos.</TableCell>
                                    </TableRow>
                                ) : filteredLoans.map((loan: any) => {
                                    const nextInstallment = loan.schedule?.[0];
                                    return (
                                        <TableRow key={loan.id} className="group hover:bg-green-500/5 transition-all">
                                            <TableCell className="font-mono text-xs font-bold py-4">{loan.loanNumber}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm">{loan.client.firstName} {loan.client.lastName}</span>
                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-tighter">
                                                        <User className="h-2 w-2" /> ID: {loan.id.slice(0, 8)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-bold text-sm">
                                                RD$ {nextInstallment ? Number(nextInstallment.remainingBalance).toLocaleString() : Number(loan.amount).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {nextInstallment ? (
                                                    <div className="flex flex-col items-center">
                                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                            RD$ {Number(nextInstallment.totalAmount).toLocaleString()}
                                                        </Badge>
                                                        <span className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            Vence: {new Date(nextInstallment.dueDate).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">Al día</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-green-600 hover:bg-green-100 hover:text-green-700 hover:scale-110 transition-transform"
                                                                onClick={() => handleOpenPayment(loan)}
                                                            >
                                                                <CreditCard className="h-5 w-5" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Registrar Pago</TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Payment Dialog */}
                <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                    <DialogContent className="sm:max-w-[425px] border-green-500/20 shadow-green-500/10">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-green-600">
                                <CreditCard className="h-5 w-5" /> Registrar Cobro
                            </DialogTitle>
                            <DialogDescription>
                                Confirmar recepción de pago para la cuota actual.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-1 bg-green-500/5 p-4 rounded-lg border border-green-500/10">
                                <p className="text-xs uppercase text-green-600 font-bold">Resumen de Cuota</p>
                                <div className="flex justify-between font-bold text-xl">
                                    <span>Total a Pagar:</span>
                                    <span>RD$ {selectedLoan?.schedule?.[0] ? Number(selectedLoan.schedule[0].totalAmount).toLocaleString() : "0"}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase">Método de Pago</label>
                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1 bg-green-500/5 border-green-500/30 font-bold">Efectivo</Button>
                                    <Button variant="outline" className="flex-1 transition-all hover:bg-muted font-bold text-muted-foreground">Transferencia</Button>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>Cancelar</Button>
                            <Button
                                className="bg-green-600 hover:bg-green-700 text-white font-bold tracking-wide"
                                onClick={() => paymentMutation.mutate({
                                    loanId: selectedLoan?.id,
                                    scheduleId: selectedLoan?.schedule?.[0]?.id,
                                    amountPaid: selectedLoan?.schedule?.[0]?.totalAmount,
                                    paymentMethod: 'cash'
                                })}
                                disabled={paymentMutation.isPending || !selectedLoan?.schedule?.[0]}
                            >
                                {paymentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "CONFIRMAR PAGO"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}
