"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import {
    User,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    CalendarDays,
    ArrowLeft,
    TrendingUp,
    CreditCard,
    AlertTriangle,
    CheckCircle2,
    Ban,
    FileText,
    History,
    FileImage
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
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function ClientProfilePage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const clientId = params.id as string;

    const { data, isLoading } = useQuery({
        queryKey: ["client-history", clientId],
        queryFn: async () => {
            const { data } = await axios.get(`/api/clients/${clientId}/history`);
            return data;
        },
    });

    const statusMutation = useMutation({
        mutationFn: async (newStatus: string) => {
            const { data } = await axios.patch(`/api/clients/${clientId}`, { status: newStatus });
            return data;
        },
        onSuccess: (updatedClient) => {
            queryClient.invalidateQueries({ queryKey: ["client-history", clientId] });
            toast.success(`Estado actualizado a ${updatedClient.status}`);
        },
        onError: () => {
            toast.error("Error al actualizar el estado");
        }
    });

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando perfil del cliente...</div>;
    }

    if (!data || !data.client) {
        return <div className="p-8 text-center text-red-500">Cliente no encontrado.</div>;
    }

    const { client, stats, loans, recentPayments } = data;

    const statusMap: Record<string, { label: string, color: string, icon: any }> = {
        active: { label: "Activo", color: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle2 },
        blocked: { label: "Bloqueado", color: "bg-red-500/10 text-red-600 border-red-500/20", icon: Ban },
        defaulted: { label: "Moroso", color: "bg-orange-500/10 text-orange-600 border-orange-500/20", icon: AlertTriangle },
    };

    const StatusIcon = statusMap[client.status]?.icon || User;

    return (
        <div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                <div className="flex items-start gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="mt-1">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center justify-center h-20 w-20 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-inner overflow-hidden">
                        {client.imageUrl ? (
                            <img src={client.imageUrl} alt={client.firstName} className="h-full w-full object-cover" />
                        ) : (
                            <User className="h-10 w-10" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">{client.firstName} {client.lastName}</h1>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Badge className={`cursor-pointer transition-all hover:scale-105 ${statusMap[client.status]?.color} border px-3 py-1 text-xs shadow-sm flex items-center gap-1`}>
                                        <StatusIcon className="h-3 w-3" />
                                        {statusMap[client.status]?.label || client.status}
                                    </Badge>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuLabel>Cambiar Estado</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => statusMutation.mutate("active")} disabled={statusMutation.isPending}>
                                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" /> Activo
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => statusMutation.mutate("blocked")} disabled={statusMutation.isPending}>
                                        <Ban className="mr-2 h-4 w-4 text-red-600" /> Bloqueado
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => statusMutation.mutate("defaulted")} disabled={statusMutation.isPending}>
                                        <AlertTriangle className="mr-2 h-4 w-4 text-orange-600" /> Moroso
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4" /> Cédula: <strong>{client.cedula}</strong>
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2 text-sm text-muted-foreground">
                    {client.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {client.phone}</div>}
                    {client.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {client.email}</div>}
                    <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Registrado: {new Date(client.createdAt).toLocaleDateString()}</div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-md bg-gradient-to-br from-blue-500/5 to-transparent">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" /> Historial de Préstamos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-blue-600">{stats.totalLoans}</span>
                            <span className="text-xs text-muted-foreground font-bold mb-1 opacity-80">En total</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-gradient-to-br from-emerald-500/5 to-transparent">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-emerald-500" /> Préstamos Activos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-emerald-600">{stats.activeLoansCount}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-gradient-to-br from-violet-500/5 to-transparent">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-violet-500" /> Deuda Activa
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-bold text-violet-600">RD$ {stats.totalDebt.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-gradient-to-br from-amber-500/5 to-transparent">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-2">
                            <History className="h-4 w-4 text-amber-500" /> Total Pagado
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-bold text-amber-600">RD$ {stats.totalPaid.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Tabs */}
            <Tabs defaultValue="loans" className="w-full">
                <TabsList className="grid w-full grid-cols-3 md:w-[600px] mb-4">
                    <TabsTrigger value="loans">Expedientes de Préstamo</TabsTrigger>
                    <TabsTrigger value="payments">Historial de Pagos</TabsTrigger>
                    <TabsTrigger value="statement">Estado de Cuenta</TabsTrigger>
                </TabsList>

                <TabsContent value="loans" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="border-none shadow-lg">
                        <CardHeader>
                            <CardTitle>Historial de Préstamos</CardTitle>
                            <CardDescription>Todos los préstamos solicitados por este cliente.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nº Préstamo</TableHead>
                                        <TableHead>Monto</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loans.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground italic h-24">No hay préstamos registrados.</TableCell>
                                        </TableRow>
                                    ) : loans.map((loan: any) => (
                                        <TableRow key={loan.id}>
                                            <TableCell className="font-mono font-bold text-xs">{loan.loanNumber}</TableCell>
                                            <TableCell className="font-bold">RD$ {Number(loan.amount).toLocaleString()}</TableCell>
                                            <TableCell>{new Date(loan.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="uppercase text-[10px] tracking-wider">
                                                    {loan.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payments" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="border-none shadow-lg">
                        <CardHeader>
                            <CardTitle>Últimos Pagos</CardTitle>
                            <CardDescription>Registro de cobros asociados a los préstamos de este cliente.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Préstamo</TableHead>
                                        <TableHead>Método</TableHead>
                                        <TableHead className="text-right">Monto Pagado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentPayments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground italic h-24">No hay pagos registrados.</TableCell>
                                        </TableRow>
                                    ) : recentPayments.map((payment: any) => (
                                        <TableRow key={payment.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{new Date(payment.paymentDate).toLocaleDateString()}</span>
                                                    {payment.referenceNumber && <span className="text-[10px] text-muted-foreground uppercase">Ref: {payment.referenceNumber}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs font-bold">{payment.loan.loanNumber}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="uppercase text-[10px] tracking-wider">
                                                    {payment.paymentMethod}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-blue-600">
                                                RD$ {Number(payment.amountPaid).toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Account Statement Tab */}
                <TabsContent value="statement" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="border-none shadow-xl bg-card/60 backdrop-blur-md">
                        <CardHeader className="flex flex-row items-start justify-between">
                            <div>
                                <CardTitle className="text-2xl flex items-center gap-2">
                                    <FileText className="h-6 w-6 text-primary" />
                                    Estado de Cuenta Consolidado
                                </CardTitle>
                                <CardDescription>Resumen financiero al {new Date().toLocaleDateString()}</CardDescription>
                            </div>
                            <Button variant="outline" onClick={() => window.print()} className="print:hidden">
                                Imprimir / Guardar PDF
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-8 print:p-0">
                            <div className="grid grid-cols-2 gap-8 p-6 bg-muted/30 rounded-lg">
                                <div>
                                    <h3 className="font-semibold text-sm text-muted-foreground uppercase mb-2">Datos del Cliente</h3>
                                    <p className="font-bold text-lg">{client.firstName} {client.lastName}</p>
                                    <p className="font-mono text-sm text-muted-foreground">Cédula: {client.cedula}</p>
                                    <p className="text-sm text-muted-foreground">{client.phone} | {client.email}</p>
                                </div>
                                <div className="text-right">
                                    <h3 className="font-semibold text-sm text-muted-foreground uppercase mb-2">Resumen de Cuenta</h3>
                                    <p className="text-sm">Total Préstamos: <span className="font-bold">{stats.totalLoans}</span></p>
                                    <p className="text-sm">Balance Activo: <span className="font-bold text-violet-600">RD$ {stats.totalDebt.toLocaleString()}</span></p>
                                    <p className="text-sm">Total Pagado: <span className="font-bold text-amber-600">RD$ {stats.totalPaid.toLocaleString()}</span></p>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <h3 className="font-bold text-lg mb-4">Detalle de Préstamos Activos & Aprobados</h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead>Nº Préstamo</TableHead>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead className="text-right">Monto Original</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loans.filter((l: any) => l.status === 'active' || l.status === 'approved').length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-muted-foreground italic">No hay préstamos activos.</TableCell>
                                            </TableRow>
                                        ) : loans.filter((l: any) => l.status === 'active' || l.status === 'approved').map((loan: any) => (
                                            <TableRow key={loan.id}>
                                                <TableCell className="font-mono font-bold text-xs">{loan.loanNumber}</TableCell>
                                                <TableCell>{new Date(loan.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell><Badge variant="outline" className="uppercase text-[10px]">{loan.status}</Badge></TableCell>
                                                <TableCell className="text-right font-bold">RD$ {Number(loan.amount).toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
