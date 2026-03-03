"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
    TrendingUp,
    Users,
    Clock,
    AlertCircle,
    Search,
    Filter,
    MoreHorizontal,
    Eye,
    Edit,
    CreditCard,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    ReceiptText
} from "lucide-react";
import { useState } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface PortfolioData {
    stats: {
        totalPortfolio: number;
        activeLoansCount: number;
        projectedInterest: number;
        totalOverdue: number;
    };
    loans: any[];
}

export default function PortfolioReportPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLoan, setSelectedLoan] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const { data, isLoading } = useQuery<PortfolioData>({
        queryKey: ["report-portfolio"],
        queryFn: async () => {
            const { data } = await axios.get("/api/reports/portfolio");
            return data;
        },
    });

    // Payment Mutation
    const paymentMutation = useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await axios.post("/api/payments", payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["report-portfolio"] });
            toast.success("Pago registrado correctamente");
            setIsPaymentOpen(false);
        },
        onError: () => {
            toast.error("Error al registrar el pago");
        }
    });

    // Edit Mutation
    const updateLoanMutation = useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
            const { data } = await axios.patch(`/api/loans/${id}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["report-portfolio"] });
            toast.success("Préstamo actualizado correctamente");
            setIsEditOpen(false);
        },
        onError: () => {
            toast.error("Error al actualizar el préstamo");
        }
    });

    const filteredLoans = data?.loans?.filter(loan =>
        loan.loanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${loan.client.firstName} ${loan.client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100-2rem)] min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
                {/* ... (KPI Cards stay same) */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reporte de Cartera</h1>
                    <p className="text-muted-foreground">Visión general del estado financiero y préstamos activos.</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-none shadow-lg bg-gradient-to-br from-primary/10 to-transparent backdrop-blur-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Cartera Total</CardTitle>
                            <TrendingUp className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">RD$ {data?.stats.totalPortfolio.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                <span className="text-emerald-500 inline-flex items-center gap-0.5">
                                    <ArrowUpRight className="h-3 w-3" /> +2.5%
                                </span> {" "}
                                vs mes anterior
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500/10 to-transparent backdrop-blur-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Préstamos Activos</CardTitle>
                            <Users className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data?.stats.activeLoansCount}</div>
                            <p className="text-xs text-muted-foreground mt-1">Créditos en ejecución</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-gradient-to-br from-amber-500/10 to-transparent backdrop-blur-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Intereses Pendientes</CardTitle>
                            <Clock className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">RD$ {data?.stats.projectedInterest.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">Proyección de cobro</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-gradient-to-br from-red-500/10 to-transparent backdrop-blur-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Mora Total</CardTitle>
                            <AlertCircle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">RD$ {data?.stats.totalOverdue.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                <span className="text-red-500 inline-flex items-center gap-0.5">
                                    <ArrowDownRight className="h-3 w-3" /> -1.2%
                                </span> {" "}
                                estabilización
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-none shadow-xl bg-card/60 backdrop-blur-md overflow-hidden">
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Listado de Cartera Activa</CardTitle>
                                <CardDescription>Detalle individual de cada préstamo vigente.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar por número o cliente..."
                                        className="pl-9 w-[280px] bg-background/50"
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
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-[120px]">Nº Préstamo</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead className="text-right">Monto</TableHead>
                                    <TableHead>Progreso</TableHead>
                                    <TableHead>Próximo Pago</TableHead>
                                    <TableHead className="w-[120px] text-center">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLoans.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic">
                                            No hay préstamos activos que coincidan.
                                        </TableCell>
                                    </TableRow>
                                ) : filteredLoans.map((loan: any) => {
                                    const nextInstallment = loan.schedule?.[0];
                                    return (
                                        <TableRow key={loan.id} className="hover:bg-primary/5 transition-colors group">
                                            <TableCell className="font-mono text-xs font-bold">{loan.loanNumber}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{loan.client.firstName} {loan.client.lastName}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase">{loan.loanType.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-primary">
                                                RD$ {Number(loan.amount).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="min-w-[150px]">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex justify-between text-[10px] font-medium">
                                                        <span>Progreso</span>
                                                        <span>35%</span>
                                                    </div>
                                                    <Progress value={35} className="h-1.5" />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                                    {nextInstallment ? (
                                                        <span>{new Date(nextInstallment.dueDate).toLocaleDateString()}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground italic">No pendiente</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                                onClick={() => {
                                                                    setSelectedLoan(loan);
                                                                    setIsDetailsOpen(true);
                                                                }}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Ver Detalles</TooltipContent>
                                                    </Tooltip>

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-blue-600"
                                                                onClick={() => {
                                                                    setSelectedLoan(loan);
                                                                    setIsEditOpen(true);
                                                                }}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Editar</TooltipContent>
                                                    </Tooltip>

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-green-600"
                                                                onClick={() => {
                                                                    setSelectedLoan(loan);
                                                                    setIsPaymentOpen(true);
                                                                }}
                                                            >
                                                                <CreditCard className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Cobrar Cuota</TooltipContent>
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

                {/* Details Dialog */}
                <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-primary/20">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                <ReceiptText className="h-6 w-6 text-primary" />
                                Expediente: {selectedLoan?.loanNumber}
                            </DialogTitle>
                            <DialogDescription>
                                Detalles completos del préstamo y cliente.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedLoan && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                <div className="space-y-4">
                                    <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Información del Cliente</h3>
                                        <p className="font-semibold">{selectedLoan.client.firstName} {selectedLoan.client.lastName}</p>
                                        <p className="text-xs text-muted-foreground">{selectedLoan.client.email || "Sin email"}</p>
                                        <p className="text-xs text-muted-foreground">{selectedLoan.client.phone || "Sin teléfono"}</p>
                                    </div>
                                    <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Condiciones</h3>
                                        <div className="flex justify-between text-xs">
                                            <span>Monto Original:</span>
                                            <span className="font-bold">RD$ {Number(selectedLoan.amount).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span>Tasa Anual:</span>
                                            <span className="font-bold">{selectedLoan.interestRate}%</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span>Plazo:</span>
                                            <span className="font-bold">{selectedLoan.termMonths} meses</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Próximo Pago Pendiente</h3>
                                    {selectedLoan.schedule?.[0] ? (
                                        <div className="border border-primary/20 p-4 rounded-lg bg-primary/5 space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span>Fecha Límite:</span>
                                                <span className="font-bold">{new Date(selectedLoan.schedule[0].dueDate).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex justify-between text-lg font-bold text-primary">
                                                <span>Total a Pagar:</span>
                                                <span>RD$ {Number(selectedLoan.schedule[0].totalAmount).toLocaleString()}</span>
                                            </div>
                                            <Button
                                                className="w-full h-10 gap-2"
                                                onClick={() => {
                                                    setIsDetailsOpen(false);
                                                    setIsPaymentOpen(true);
                                                }}
                                            >
                                                <CreditCard className="h-4 w-4" /> Registrar Cobro
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="p-4 text-center border rounded-lg italic text-muted-foreground">
                                            No hay cuotas pendientes.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Editar Préstamo</DialogTitle>
                            <DialogDescription>
                                Modifique los campos básicos del préstamo.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            updateLoanMutation.mutate({
                                id: selectedLoan.id,
                                payload: {
                                    purpose: formData.get("purpose") as string,
                                }
                            });
                        }}>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase">Propósito / Notas</label>
                                    <Input
                                        name="purpose"
                                        defaultValue={selectedLoan?.purpose || ""}
                                        className="focus-visible:ring-primary"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={updateLoanMutation.isPending}>
                                    {updateLoanMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Cambios"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

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
                                    <span>Total:</span>
                                    <span>RD$ {selectedLoan?.schedule?.[0] ? Number(selectedLoan.schedule[0].totalAmount).toLocaleString() : "0"}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase">Método de Pago</label>
                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1 bg-green-500/5 border-green-500/30">Efectivo</Button>
                                    <Button variant="outline" className="flex-1 transition-all hover:bg-muted">Transferencia</Button>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>Cancelar</Button>
                            <Button
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => paymentMutation.mutate({
                                    loanId: selectedLoan.id,
                                    scheduleId: selectedLoan.schedule?.[0]?.id,
                                    amountPaid: selectedLoan.schedule?.[0]?.totalAmount,
                                    paymentMethod: 'cash'
                                })}
                                disabled={paymentMutation.isPending || !selectedLoan?.schedule?.[0]}
                            >
                                {paymentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Pago"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}
