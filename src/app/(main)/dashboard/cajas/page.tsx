"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
    Plus,
    Vault,
    ArrowRightLeft,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Activity,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Caja {
    id: string;
    nombre: string;
    tipo: "principal" | "chica";
    saldoActual: string;
    cuentaContable: string | null;
    limiteMaximo: string | null;
    isActive: boolean;
    createdAt: string;
    sesiones: {
        id: string;
        estado: "abierta" | "cerrada";
        user: { name: string };
    }[];
}

interface CajaStats {
    totalEnCajas: number;
    cajasActivas: number;
    totalIngresos: number;
    totalGastos: number;
    totalMovimientos: number;
    flujoNeto: number;
}

export default function CajasPage() {
    const queryClient = useQueryClient();
    const [createOpen, setCreateOpen] = useState(false);
    const [transferOpen, setTransferOpen] = useState(false);

    // Form states
    const [nombre, setNombre] = useState("");
    const [tipo, setTipo] = useState<"principal" | "chica">("principal");
    const [cuentaContable, setCuentaContable] = useState("");
    const [limiteMaximo, setLimiteMaximo] = useState("");

    // Transfer form states
    const [cajaOrigenId, setCajaOrigenId] = useState("");
    const [cajaDestinoId, setCajaDestinoId] = useState("");
    const [montoTraspaso, setMontoTraspaso] = useState("");
    const [conceptoTraspaso, setConceptoTraspaso] = useState("");

    const { data: cajas, isLoading } = useQuery<Caja[]>({
        queryKey: ["cajas"],
        queryFn: async () => {
            const { data } = await axios.get("/api/cajas");
            return data;
        },
    });

    const { data: stats } = useQuery<CajaStats>({
        queryKey: ["cajas-stats"],
        queryFn: async () => {
            const { data } = await axios.get("/api/cajas/stats");
            return data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (values: {
            nombre: string;
            tipo: string;
            cuentaContable?: string;
            limiteMaximo?: string;
        }) => {
            const { data } = await axios.post("/api/cajas", values);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cajas"] });
            queryClient.invalidateQueries({ queryKey: ["cajas-stats"] });
            setCreateOpen(false);
            resetCreateForm();
        },
    });

    const transferMutation = useMutation({
        mutationFn: async (values: {
            cajaOrigenId: string;
            cajaDestinoId: string;
            monto: string;
            concepto: string;
        }) => {
            const { data } = await axios.post("/api/cajas/traspasos", values);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cajas"] });
            queryClient.invalidateQueries({ queryKey: ["cajas-stats"] });
            setTransferOpen(false);
            resetTransferForm();
        },
    });

    const resetCreateForm = () => {
        setNombre("");
        setTipo("principal");
        setCuentaContable("");
        setLimiteMaximo("");
    };

    const resetTransferForm = () => {
        setCajaOrigenId("");
        setCajaDestinoId("");
        setMontoTraspaso("");
        setConceptoTraspaso("");
    };

    const handleCreate = () => {
        createMutation.mutate({
            nombre,
            tipo,
            cuentaContable: cuentaContable || undefined,
            limiteMaximo: limiteMaximo || undefined,
        });
    };

    const handleTransfer = () => {
        transferMutation.mutate({
            cajaOrigenId,
            cajaDestinoId,
            monto: montoTraspaso,
            concepto: conceptoTraspaso,
        });
    };

    if (isLoading) {
        return (
            <div className="p-6 h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Gestión de Cajas</h1>
                    <p className="text-muted-foreground text-sm font-medium">
                        Administra el flujo de efectivo y controla las sesiones de caja.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <ArrowRightLeft className="mr-2 h-4 w-4" /> Traspaso
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Traspaso entre Cajas</DialogTitle>
                                <DialogDescription>
                                    Transfiere fondos de una caja a otra. Ambas cajas deben tener
                                    sesiones abiertas.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="cajaOrigen">Caja Origen</Label>
                                    <Select value={cajaOrigenId} onValueChange={setCajaOrigenId}>
                                        <SelectTrigger id="cajaOrigen">
                                            <SelectValue placeholder="Seleccionar caja origen" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {cajas
                                                ?.filter(
                                                    (c) =>
                                                        c.sesiones.some((s) => s.estado === "abierta") &&
                                                        c.id !== cajaDestinoId,
                                                )
                                                .map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.nombre} (${Number(c.saldoActual).toLocaleString()})
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="cajaDestino">Caja Destino</Label>
                                    <Select
                                        value={cajaDestinoId}
                                        onValueChange={setCajaDestinoId}
                                    >
                                        <SelectTrigger id="cajaDestino">
                                            <SelectValue placeholder="Seleccionar caja destino" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {cajas
                                                ?.filter(
                                                    (c) =>
                                                        c.sesiones.some((s) => s.estado === "abierta") &&
                                                        c.id !== cajaOrigenId,
                                                )
                                                .map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.nombre} (${Number(c.saldoActual).toLocaleString()})
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="montoTraspaso">Monto</Label>
                                    <Input
                                        id="montoTraspaso"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        placeholder="0.00"
                                        value={montoTraspaso}
                                        onChange={(e) => setMontoTraspaso(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="conceptoTraspaso">Concepto</Label>
                                    <Input
                                        id="conceptoTraspaso"
                                        placeholder="Ej: Traspaso a caja principal"
                                        value={conceptoTraspaso}
                                        onChange={(e) => setConceptoTraspaso(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    onClick={handleTransfer}
                                    disabled={
                                        transferMutation.isPending ||
                                        !cajaOrigenId ||
                                        !cajaDestinoId ||
                                        !montoTraspaso ||
                                        !conceptoTraspaso
                                    }
                                >
                                    {transferMutation.isPending
                                        ? "Procesando..."
                                        : "Realizar Traspaso"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Nueva Caja
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Crear Nueva Caja</DialogTitle>
                                <DialogDescription>
                                    Configura una nueva caja para gestionar efectivo.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="nombre">Nombre</Label>
                                    <Input
                                        id="nombre"
                                        placeholder="Ej: Caja Principal Oficina"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="tipo">Tipo</Label>
                                    <Select
                                        value={tipo}
                                        onValueChange={(v) => setTipo(v as "principal" | "chica")}
                                    >
                                        <SelectTrigger id="tipo">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="principal">
                                                Caja Principal
                                            </SelectItem>
                                            <SelectItem value="chica">Caja Chica</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="cuentaContable">
                                        Cuenta Contable (opcional)
                                    </Label>
                                    <Input
                                        id="cuentaContable"
                                        placeholder="Ej: 1101-001"
                                        value={cuentaContable}
                                        onChange={(e) => setCuentaContable(e.target.value)}
                                    />
                                </div>
                                {tipo === "chica" && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="limiteMaximo">Límite Máximo</Label>
                                        <Input
                                            id="limiteMaximo"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            value={limiteMaximo}
                                            onChange={(e) => setLimiteMaximo(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button
                                    onClick={handleCreate}
                                    disabled={createMutation.isPending || !nombre}
                                >
                                    {createMutation.isPending ? "Creando..." : "Crear Caja"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total en Cajas
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${stats?.totalEnCajas?.toLocaleString() ?? "0"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.cajasActivas ?? 0} cajas activas
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Ingresos Totales
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">
                            +${stats?.totalIngresos?.toLocaleString() ?? "0"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Todos los ingresos registrados
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Gastos Totales
                        </CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            -${stats?.totalGastos?.toLocaleString() ?? "0"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Todos los gastos registrados
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Movimientos
                        </CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats?.totalMovimientos ?? 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Flujo neto: ${stats?.flujoNeto?.toLocaleString() ?? "0"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Cajas Grid */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Cajas Registradas</h2>
                {!cajas || cajas.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Vault className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground text-center">
                                No hay cajas registradas. Crea tu primera caja para comenzar.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {cajas.map((caja) => {
                            const openSession = caja.sesiones.find(
                                (s) => s.estado === "abierta",
                            );
                            const saldo = Number(caja.saldoActual);
                            const exceedsLimit =
                                caja.tipo === "chica" &&
                                caja.limiteMaximo &&
                                saldo > Number(caja.limiteMaximo);

                            return (
                                <Link key={caja.id} href={`/dashboard/cajas/${caja.id}`}>
                                    <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 relative overflow-hidden">
                                        {exceedsLimit && (
                                            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
                                        )}
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Vault className="h-5 w-5 text-primary" />
                                                    <CardTitle className="text-base">
                                                        {caja.nombre}
                                                    </CardTitle>
                                                </div>
                                                <Badge
                                                    variant={
                                                        caja.tipo === "principal"
                                                            ? "default"
                                                            : "secondary"
                                                    }
                                                >
                                                    {caja.tipo === "principal"
                                                        ? "Principal"
                                                        : "Chica"}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Saldo Actual
                                                    </p>
                                                    <p className="text-2xl font-bold">
                                                        ${saldo.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>

                                                {caja.limiteMaximo && (
                                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                        <span>Límite: ${Number(caja.limiteMaximo).toLocaleString()}</span>
                                                        {exceedsLimit && (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-amber-600 border-amber-300 bg-amber-50"
                                                            >
                                                                Excede límite
                                                            </Badge>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="pt-2 border-t">
                                                    {openSession ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="relative flex h-2 w-2">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                                            </span>
                                                            <span className="text-sm text-emerald-600 font-medium">
                                                                Abierta
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                · {openSession.user.name}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className="h-2 w-2 rounded-full bg-gray-300" />
                                                            <span className="text-sm text-muted-foreground">
                                                                Sin sesión activa
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {caja.cuentaContable && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Cuenta: {caja.cuentaContable}
                                                    </p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
