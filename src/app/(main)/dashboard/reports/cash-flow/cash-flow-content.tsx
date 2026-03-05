"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
    Activity,
    CalendarDays,
    DollarSign,
    LineChart as LineChartIcon,
    PieChart,
    Search,
    TrendingUp
} from "lucide-react";
import { useState } from "react";
import {
    Area,
    AreaChart,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function CashFlowPage() {
    const [daysAhead, setDaysAhead] = useState("90");
    const [searchTerm, setSearchTerm] = useState("");

    const { data: reportData, isLoading } = useQuery({
        queryKey: ["cash-flow", daysAhead],
        queryFn: async () => {
            const { data } = await axios.get(`/api/reports/cash-flow?days=${daysAhead}`);
            return data;
        },
    });

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Calculando proyecciones de flujo de caja...</div>;
    }

    if (!reportData) {
        return <div className="p-8 text-center text-red-500">Error al cargar las proyecciones.</div>;
    }

    const { summary, weeklyChartData, installments } = reportData;

    const filteredInstallments = installments.filter((item: any) =>
        item.loanNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <LineChartIcon className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Flujo de Caja Esperado</h1>
                        <p className="text-muted-foreground italic">Proyección de ingresos basados en cuotas por cobrar.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Proyectar a:</span>
                    <Select value={daysAhead} onValueChange={setDaysAhead}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Seleccionar periodo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="30">Próximos 30 días</SelectItem>
                            <SelectItem value="90">Próximos 90 días</SelectItem>
                            <SelectItem value="180">Próximos 6 meses</SelectItem>
                            <SelectItem value="365">Próximo año</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-md bg-gradient-to-br from-emerald-500/10 to-transparent">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-emerald-500" /> Ingreso Total Proyectado
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-emerald-600">
                                RD$ {summary.totalExpectedIncome.toLocaleString()}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Del {new Date(summary.startDate).toLocaleDateString()} al {new Date(summary.endDate).toLocaleDateString()}</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-blue-500/5 to-transparent">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-blue-500" /> Recuperación de Capital
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-blue-600">
                                RD$ {summary.totalExpectedPrincipal.toLocaleString()}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-gradient-to-br from-amber-500/5 to-transparent">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-2">
                            <PieChart className="h-4 w-4 text-amber-500" /> Ingreso por Intereses
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-amber-600">
                                RD$ {summary.totalExpectedInterest.toLocaleString()}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <Card className="border-none shadow-lg mt-4 bg-card/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-emerald-500" />
                        Proyección Semanal
                    </CardTitle>
                    <CardDescription>
                        Estimación de ingresos agrupados por semana (Capital + Interés).
                    </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                    {weeklyChartData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground italic">
                            No hay cuotas programadas para este periodo.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={weeklyChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={10} />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `RD$${(value / 1000).toFixed(0)}k`}
                                />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <RechartsTooltip
                                    formatter={(value: number, name: string) => {
                                        if (name === "total") return [`RD$ ${value.toLocaleString()}`, 'Ingreso Total'];
                                        if (name === "principal") return [`RD$ ${value.toLocaleString()}`, 'Capital'];
                                        if (name === "interest") return [`RD$ ${value.toLocaleString()}`, 'Interés'];
                                        return [value, name];
                                    }}
                                    labelFormatter={(label) => `Semana: ${label}`}
                                />
                                <Area type="monotone" dataKey="total" stroke="#10b981" fillOpacity={1} fill="url(#colorTotal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* Detailed Table */}
            <Card className="border-none shadow-xl overflow-hidden mt-4">
                <CardHeader className="bg-muted/30 border-b">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Detalle de Cuotas Programadas</CardTitle>
                            <CardDescription>Desglose cronológico de los cobros esperados en el periodo.</CardDescription>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por préstamo..."
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
                                <TableHead className="py-4 pl-6">Fecha Esperada</TableHead>
                                <TableHead>Préstamo</TableHead>
                                <TableHead className="text-right">Capital</TableHead>
                                <TableHead className="text-right">Interés</TableHead>
                                <TableHead className="text-right pr-6">Monto Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredInstallments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">No hay cuotas o cobros planificados.</TableCell>
                                </TableRow>
                            ) : filteredInstallments.map((item: any, index: number) => (
                                <TableRow key={index} className="hover:bg-emerald-50/50">
                                    <TableCell className="pl-6">
                                        <div className="flex items-center gap-2">
                                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-semibold">{new Date(item.dueDate).toLocaleDateString()}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-mono text-xs font-bold">{item.loanNumber}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        RD$ {Number(item.principal).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        RD$ {Number(item.interest).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right pr-6 font-bold text-emerald-600">
                                        RD$ {Number(item.total).toLocaleString()}
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
