"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
    AlertTriangle,
    Search,
    Filter,
    Calendar,
    User,
    Calculator,
    Bell
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function OverdueCollectionsPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const { data: overdue = [], isLoading } = useQuery({
        queryKey: ["collections-overdue"],
        queryFn: async () => {
            const { data } = await axios.get("/api/collections/overdue");
            return data;
        },
    });

    const filteredOverdue = overdue.filter((item: any) =>
        item.loan.loanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${item.client.firstName} ${item.client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getDaysOverdue = (dueDateStr: string) => {
        const dueDate = new Date(dueDateStr);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - dueDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const handleNotify = (clientName: string) => {
        toast.success(`Notificación enviada a ${clientName}`);
    };

    const handleCalculatePenalty = (loanNumber: string) => {
        toast.info(`Cálculo de penalidad iniciado para el préstamo ${loanNumber}`);
    };

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Cotrol de Cuotas Vencidas</h1>
                            <p className="text-muted-foreground italic">Gestión y seguimiento de atrasos en la cartera.</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-none shadow-md bg-gradient-to-br from-red-500/5 to-transparent">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Cuotas Vencidas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-bold text-red-600">{overdue.length}</span>
                                <span className="text-xs text-muted-foreground font-bold mb-1 opacity-80">En Riesgo</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-md bg-gradient-to-br from-amber-500/5 to-transparent">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Monto en Riesgo</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-bold text-amber-600">
                                    RD$ {overdue.reduce((acc: number, curr: any) => acc + Number(curr.totalAmount), 0).toLocaleString()}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-none shadow-xl bg-card/60 backdrop-blur-md overflow-hidden">
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Detalle de Mora</CardTitle>
                                <CardDescription>Listado de clientes con cuotas pendientes de pago.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar por préstamo o cliente..."
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
                                    <TableHead className="font-bold py-4">Préstamo</TableHead>
                                    <TableHead className="font-bold">Cliente</TableHead>
                                    <TableHead className="font-bold text-center">Vencimiento</TableHead>
                                    <TableHead className="font-bold text-center">Días de Atraso</TableHead>
                                    <TableHead className="font-bold text-right">Cuota Vencida</TableHead>
                                    <TableHead className="font-bold text-center">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">Cargando datos de mora...</TableCell>
                                    </TableRow>
                                ) : filteredOverdue.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">Genial, no hay cuotas vencidas encontradas.</TableCell>
                                    </TableRow>
                                ) : filteredOverdue.map((item: any) => {
                                    const daysOverdue = getDaysOverdue(item.dueDate);
                                    let severityColor = "bg-amber-500/10 text-amber-600 border-amber-500/20";
                                    if (daysOverdue > 30) severityColor = "bg-red-500/10 text-red-600 border-red-500/20";
                                    if (daysOverdue > 90) severityColor = "bg-purple-500/10 text-purple-600 border-purple-500/20";

                                    return (
                                        <TableRow key={item.id} className="group hover:bg-red-500/5 transition-all">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-xs font-bold">{item.loan.loanNumber}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase">Cuota #{item.installmentNumber}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm">{item.client.firstName} {item.client.lastName}</span>
                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-tighter">
                                                        <User className="h-2 w-2" /> ID: {item.client.id.slice(0, 8)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1 text-sm font-medium">
                                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                                    {new Date(item.dueDate).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={`${severityColor} border font-bold px-2.5 py-0.5 text-[11px] shadow-sm`}>
                                                    {daysOverdue} días
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-sm text-red-600">
                                                RD$ {Number(item.totalAmount).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-blue-600 hover:bg-blue-100"
                                                                onClick={() => handleNotify(`${item.client.firstName} ${item.client.lastName}`)}
                                                            >
                                                                <Bell className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Notificar Cliente</TooltipContent>
                                                    </Tooltip>

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-amber-600 hover:bg-amber-100"
                                                                onClick={() => handleCalculatePenalty(item.loan.loanNumber)}
                                                            >
                                                                <Calculator className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Calcular Penalidad</TooltipContent>
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
