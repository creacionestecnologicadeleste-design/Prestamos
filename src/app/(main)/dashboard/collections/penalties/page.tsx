"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
    Calculator,
    Search,
    Filter,
    Calendar,
    User,
    CheckCircle2,
    XCircle
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

export default function PenaltiesPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const { data: penalties = [], isLoading } = useQuery({
        queryKey: ["collections-penalties"],
        queryFn: async () => {
            const { data } = await axios.get("/api/collections/penalties");
            return data;
        },
    });

    const filteredPenalties = penalties.filter((item: any) =>
        item.loan.loanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${item.client.firstName} ${item.client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleForgivePenalty = (loanNumber: string) => {
        toast.success(`Penalidad exonerada para el préstamo ${loanNumber}`);
    };

    const handleMarkAsPaid = (loanNumber: string) => {
        toast.success(`Penalidad cobrada para el préstamo ${loanNumber}`);
    };

    const totalUnpaidPenalties = penalties.filter((p: any) => !p.isPaid).reduce((acc: number, curr: any) => acc + Number(curr.penaltyAmount), 0);

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Calculator className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Intereses por Mora</h1>
                            <p className="text-muted-foreground italic">Cálculo y seguimiento de penalidades por atraso.</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-none shadow-md bg-gradient-to-br from-purple-500/5 to-transparent">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Penalidades Activas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-bold text-purple-600">
                                    {penalties.filter((p: any) => !p.isPaid).length}
                                </span>
                                <span className="text-xs text-muted-foreground font-bold mb-1 opacity-80">Por Cobrar</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-md bg-gradient-to-br from-red-500/5 to-transparent">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Monto Pendiente</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-bold text-red-600">
                                    RD$ {totalUnpaidPenalties.toLocaleString()}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-none shadow-xl bg-card/60 backdrop-blur-md overflow-hidden">
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Detalle de Penalidades</CardTitle>
                                <CardDescription>Listado de intereses generados por mora.</CardDescription>
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
                                    <TableHead className="font-bold text-center">Atraso</TableHead>
                                    <TableHead className="font-bold text-center">Estado</TableHead>
                                    <TableHead className="font-bold text-right">Interés Generado</TableHead>
                                    <TableHead className="font-bold text-center">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">Cargando datos de penalidades...</TableCell>
                                    </TableRow>
                                ) : filteredPenalties.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">No se encontraron penalidades registradas.</TableCell>
                                    </TableRow>
                                ) : filteredPenalties.map((item: any) => {
                                    return (
                                        <TableRow key={item.id} className="group hover:bg-purple-500/5 transition-all">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-xs font-bold">{item.loan.loanNumber}</span>
                                                    <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(item.createdAt).toLocaleDateString()}
                                                    </span>
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
                                                <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">
                                                    {item.daysOverdue} días
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {item.isPaid ? (
                                                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 font-bold px-2.5 py-0.5 text-[10px]">Pagado</Badge>
                                                ) : (
                                                    <Badge className="bg-red-500/10 text-red-600 border-red-500/20 font-bold px-2.5 py-0.5 text-[10px]">Pendiente</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-sm text-purple-600">
                                                RD$ {Number(item.penaltyAmount).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                {!item.isPaid ? (
                                                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-green-600 hover:bg-green-100"
                                                                    onClick={() => handleMarkAsPaid(item.loan.loanNumber)}
                                                                >
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Marcar como Cobrado</TooltipContent>
                                                        </Tooltip>

                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                                                    onClick={() => handleForgivePenalty(item.loan.loanNumber)}
                                                                >
                                                                    <XCircle className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Exonerar Mora</TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic flex justify-center">Finalizado</span>
                                                )}
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
