"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
    Activity,
    AlertOctagon,
    AlertTriangle,
    ArrowUpRight,
    Calendar,
    Search,
    TrendingDown,
    UserX
} from "lucide-react";
import { useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis
} from "recharts";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
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

export default function OverdueAnalyticsPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const { data: reportData, isLoading } = useQuery({
        queryKey: ["overdue-analytics"],
        queryFn: async () => {
            const { data } = await axios.get("/api/reports/overdue");
            return data;
        },
    });

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Generando reporte de morosidad...</div>;
    }

    if (!reportData) {
        return <div className="p-8 text-center text-red-500">Error al cargar los datos del reporte.</div>;
    }

    const { summary, buckets, installments } = reportData;

    // Transform buckets object into array for Recharts
    const chartData = [
        { name: '1-15 días', amount: buckets['1-15 días'].amount, count: buckets['1-15 días'].count },
        { name: '16-30 días', amount: buckets['16-30 días'].amount, count: buckets['16-30 días'].count },
        { name: '31-60 días', amount: buckets['31-60 días'].amount, count: buckets['31-60 días'].count },
        { name: '60+ días', amount: buckets['60+ días'].amount, count: buckets['60+ días'].count },
    ];

    const filteredInstallments = installments.filter((item: any) =>
        item.loan.loanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${item.client.firstName} ${item.client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500/10 rounded-lg">
                        <AlertOctagon className="h-6 w-6 text-rose-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Análisis de Morosidad</h1>
                        <p className="text-muted-foreground italic">Visión global del riesgo y cartera vencida.</p>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-md bg-gradient-to-br from-rose-500/10 to-transparent">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-rose-500" /> Monto en Atraso
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-rose-600">
                                RD$ {summary.totalOverdueAmount.toLocaleString()}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-orange-500/5 to-transparent">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500" /> Préstamos Afectados
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-orange-600">{summary.totalLoansInArrears}</span>
                            <span className="text-xs text-muted-foreground font-bold mb-1 opacity-80">En Riesgo</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-purple-500/5 to-transparent">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-2">
                            <Activity className="h-4 w-4 text-purple-500" /> Índice de Mora
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-purple-600">
                                {summary.globalDefaultRate.toFixed(2)}%
                            </span>
                            <span className="text-xs text-muted-foreground font-bold mb-1 opacity-80">Global</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-blue-500/5 to-transparent">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-2">
                            <ArrowUpRight className="h-4 w-4 text-blue-500" /> Cartera Activa (Ref)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-bold text-blue-600">
                                RD$ {summary.totalActivePortfolio.toLocaleString()}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-none shadow-lg">
                    <CardHeader>
                        <CardTitle>Envejecimiento de Deuda</CardTitle>
                        <CardDescription>Distribución del monto vencido por rangos de días.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(value) => `RD$${value.toLocaleString()}`}
                                />
                                <RechartsTooltip
                                    formatter={(value: number) => [`RD$ ${value.toLocaleString()}`, 'Monto Atrasado']}
                                    cursor={{ fill: 'rgba(225, 29, 72, 0.05)' }}
                                />
                                <Bar dataKey="amount" fill="#e11d48" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-card/50">
                    <CardHeader>
                        <CardTitle>Distribución de Cuotas</CardTitle>
                        <CardDescription>Cantidad de cuotas vencidas por rango.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 mt-4">
                            {chartData.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-background rounded-lg border">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${index > 1 ? 'bg-rose-500' : 'bg-orange-400'}`}></div>
                                        <span className="font-medium">{item.name}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="font-bold text-lg">{item.count} cuotas</span>
                                        <span className="text-sm text-muted-foreground">RD$ {item.amount.toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Table */}
            <Card className="border-none shadow-xl overflow-hidden mt-4">
                <CardHeader className="bg-muted/30 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Detalle de Cuotas Vencidas</CardTitle>
                            <CardDescription>Listado completo de las obligaciones pendientes que generan mora.</CardDescription>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar préstamo o cliente..."
                                className="pl-9 w-[300px] bg-background"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="py-4 pl-6">Cliente</TableHead>
                                <TableHead>Préstamo</TableHead>
                                <TableHead>Fecha Venc. (Cuota)</TableHead>
                                <TableHead className="text-center">Días Atraso</TableHead>
                                <TableHead className="text-right pr-6">Monto Cuota</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredInstallments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">No se encontraron registros de cuotas vencidas.</TableCell>
                                </TableRow>
                            ) : filteredInstallments.map((item: any) => (
                                <TableRow key={item.id} className="hover:bg-rose-50/50">
                                    <TableCell className="pl-6">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-sm">{item.client.firstName} {item.client.lastName}</span>
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <UserX className="h-3 w-3" /> Cédula: {item.client.cedula}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-mono text-xs font-bold">{item.loan.loanNumber}</span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{new Date(item.dueDate).toLocaleDateString()}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                                                <Calendar className="h-3 w-3" /> Cuota #{item.installmentNumber}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className={`
                                            ${item.daysOverdue > 60 ? 'bg-red-100 text-red-700 border-red-200' :
                                                item.daysOverdue > 30 ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                    'bg-amber-50 text-amber-700 border-amber-200'}
                                        `}>
                                            {item.daysOverdue} días
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right pr-6 font-bold text-rose-600">
                                        RD$ {Number(item.totalAmount).toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
