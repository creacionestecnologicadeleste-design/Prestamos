"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
    Banknote,
    Search,
    Filter,
    Eye,
    Calendar,
    User,
    TrendingUp,
    ReceiptText as AmortizationIcon
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AmortizationTableDialog } from "../../_components/amortization-table-dialog";
import { LoanDetailsDialog } from "../../_components/loan-details-dialog";

interface Loan {
    id: string;
    loanNumber: string;
    amount: string;
    status: "pending" | "approved" | "active" | "paid" | "rejected" | "annulled";
    createdAt: string;
    client: {
        firstName: string;
        lastName: string;
    };
    loanType: {
        name: string;
    };
}

const statusMap = {
    pending: { label: "Pendiente", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    approved: { label: "Aprobado", color: "bg-sky-500/10 text-sky-600 border-sky-500/20" },
    active: { label: "Activo", color: "bg-green-500/10 text-green-600 border-green-500/20" },
    paid: { label: "Pagado", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    rejected: { label: "Rechazado", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
    annulled: { label: "Anulado", color: "bg-red-500/10 text-red-600 border-red-500/20" },
};

export default function PaidLoansPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
    const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isAmortizationOpen, setIsAmortizationOpen] = useState(false);

    const { data: loans = [], isLoading } = useQuery<Loan[]>({
        queryKey: ["loans"],
        queryFn: async () => {
            const { data } = await axios.get("/api/loans");
            return data;
        },
    });

    const filteredLoans = loans.filter(loan =>
        loan.status === "paid" && (
            loan.loanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `${loan.client.firstName} ${loan.client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const paidCount = loans.filter(l => l.status === "paid").length;
    const totalRecovered = loans.filter(l => l.status === "paid").reduce((acc, curr) => acc + Number(curr.amount), 0);

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Préstamos Pagados</h1>
                        <p className="text-muted-foreground italic">Histórico de créditos liquidados satisfactoriamente.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-none shadow-lg bg-gradient-to-br from-green-500/10 to-transparent backdrop-blur-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Total Liquidados</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{paidCount}</div>
                            <p className="text-xs text-muted-foreground mt-1 font-medium">Créditos completados</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-500/10 to-transparent backdrop-blur-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Capital Recuperado</CardTitle>
                            <Banknote className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">RD$ {totalRecovered.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1 font-medium italic">Monto total pagado</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-none shadow-xl bg-card/60 backdrop-blur-md overflow-hidden">
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Historial de Pagos Completos</CardTitle>
                                <CardDescription>Listado de clientes que han concluido sus compromisos financieros.</CardDescription>
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
                                    <TableHead className="font-bold">Tipo</TableHead>
                                    <TableHead className="font-bold text-right">Monto</TableHead>
                                    <TableHead className="font-bold text-center">Estado</TableHead>
                                    <TableHead className="font-bold">Fecha</TableHead>
                                    <TableHead className="w-[150px] text-center font-bold">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground italic">Cargando préstamos...</TableCell>
                                    </TableRow>
                                ) : filteredLoans.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground italic">No hay registros de préstamos pagados aún.</TableCell>
                                    </TableRow>
                                ) : filteredLoans.map((loan) => {
                                    const status = statusMap[loan.status];
                                    return (
                                        <TableRow key={loan.id} className="group hover:bg-primary/5 transition-all">
                                            <TableCell className="font-mono text-xs font-bold py-4">{loan.loanNumber}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm">{loan.client.firstName} {loan.client.lastName}</span>
                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-tighter">
                                                        <User className="h-2 w-2" /> ID Cliente: {loan.id.slice(0, 8)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-normal text-[10px] bg-slate-100 dark:bg-slate-800">
                                                    {loan.loanType.name}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-sm text-primary">
                                                RD$ {Number(loan.amount).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={`${status.color} border font-bold px-2.5 py-0.5 text-[10px] shadow-sm`}>
                                                    {status.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(loan.createdAt).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-1">
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
                                                                className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                                                onClick={() => router.push(`/dashboard/payments/registrar?loanId=${loan.id}`)}
                                                            >
                                                                <Banknote className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Ir a Cobros</TooltipContent>
                                                    </Tooltip>

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-indigo-600 hover:bg-indigo-50"
                                                                onClick={() => {
                                                                    setSelectedLoanId(loan.id);
                                                                    setIsAmortizationOpen(true);
                                                                }}
                                                            >
                                                                <AmortizationIcon className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Ver Amortización</TooltipContent>
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

                <AmortizationTableDialog
                    loanId={selectedLoanId}
                    open={isAmortizationOpen}
                    onOpenChange={setIsAmortizationOpen}
                />

                <LoanDetailsDialog
                    loan={selectedLoan}
                    open={isDetailsOpen}
                    onOpenChange={setIsDetailsOpen}
                />
            </div>
        </TooltipProvider>
    );
}
