"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
    ReceiptText,
    Search,
    Filter,
    MoreHorizontal,
    CheckCircle2,
    XCircle,
    Eye,
    ChevronRight,
    Calendar,
    User,
    Banknote,
    TrendingUp,
    ArrowUpRight,
    Clock,
    AlertCircle,
    CreditCard,
    Edit
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Loan {
    id: string;
    loanNumber: string;
    amount: string;
    interestRate: string;
    status: "pending" | "approved" | "active" | "paid" | "rejected";
    createdAt: string;
    purpose?: string;
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
    approved: { label: "Aprobado", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    active: { label: "Activo", color: "bg-green-500/10 text-green-600 border-green-500/20" },
    paid: { label: "Pagado", color: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
    rejected: { label: "Rechazado", color: "bg-red-500/10 text-red-600 border-red-500/20" },
};

export default function LoanListPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");

    const { data: loans = [], isLoading } = useQuery<Loan[]>({
        queryKey: ["loans"],
        queryFn: async () => {
            const { data } = await axios.get("/api/loans");
            return data;
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            const { data } = await axios.patch(`/api/loans/${id}`, { status });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["loans"] });
            toast.success("Estado del préstamo actualizado");
        },
        onError: () => {
            toast.error("Error al actualizar el estado");
        }
    });

    const filteredLoans = loans.filter(loan =>
        loan.loanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${loan.client.firstName} ${loan.client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPortfolio = loans.filter(l => l.status === "active" || l.status === "approved").reduce((acc, curr) => acc + Number(curr.amount), 0);
    const pendingCount = loans.filter(l => l.status === "pending").length;
    const activeCount = loans.filter(l => l.status === "active" || l.status === "approved").length;
    const amountToDisburse = loans.filter(l => l.status === "approved").reduce((acc, curr) => acc + Number(curr.amount), 0);

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Listado de Préstamos</h1>
                        <p className="text-muted-foreground italic">Gestión integral de cartera y nuevas solicitudes.</p>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-none shadow-lg bg-gradient-to-br from-primary/10 to-transparent backdrop-blur-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Cartera Total</CardTitle>
                            <TrendingUp className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">RD$ {totalPortfolio.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                <span className="text-emerald-500 inline-flex items-center gap-0.5 font-bold">
                                    <ArrowUpRight className="h-3 w-3" /> Activa
                                </span>
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-gradient-to-br from-amber-500/10 to-transparent backdrop-blur-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                            <Clock className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{pendingCount}</div>
                            <p className="text-xs text-muted-foreground mt-1 font-medium">Solicitudes por revisar</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500/10 to-transparent backdrop-blur-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Activos/Aprobados</CardTitle>
                            <User className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{activeCount}</div>
                            <p className="text-xs text-muted-foreground mt-1 font-medium">Créditos en curso</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-500/10 to-transparent backdrop-blur-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Por Desembolsar</CardTitle>
                            <Banknote className="h-4 w-4 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-indigo-600">RD$ {amountToDisburse.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1 font-medium italic">Monto aprobado</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-none shadow-xl bg-card/60 backdrop-blur-md overflow-hidden">
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Cartera y Solicitudes</CardTitle>
                                <CardDescription>Gestion de préstamos pendientes y activos.</CardDescription>
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
                                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground italic">No se encontraron resultados.</TableCell>
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
                                                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Ver Detalles</TooltipContent>
                                                    </Tooltip>

                                                    {loan.status === "pending" && (
                                                        <>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-green-600 hover:bg-green-50"
                                                                        onClick={() => updateStatusMutation.mutate({ id: loan.id, status: "approved" })}
                                                                    >
                                                                        <CheckCircle2 className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Aprobar Solicitud</TooltipContent>
                                                            </Tooltip>

                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-red-600 hover:bg-red-50"
                                                                        onClick={() => updateStatusMutation.mutate({ id: loan.id, status: "rejected" })}
                                                                    >
                                                                        <XCircle className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Rechazar Solicitud</TooltipContent>
                                                            </Tooltip>
                                                        </>
                                                    )}

                                                    {(loan.status === "approved" || loan.status === "active") && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-green-600 hover:bg-green-50"
                                                                >
                                                                    <CreditCard className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Ir a Cobros</TooltipContent>
                                                        </Tooltip>
                                                    )}

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Editar</TooltipContent>
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
            </div>
        </TooltipProvider>
    );
}
