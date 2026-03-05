"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
    ArrowLeft,
    Vault,
    Play,
    Square,
    Plus,
    TrendingUp,
    TrendingDown,
    ArrowRightLeft,
    AlertTriangle,
    CheckCircle2,
    Clock,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface Movimiento {
    id: string;
    tipo: string;
    monto: string;
    concepto: string;
    referencia: string | null;
    categoryId: string | null;
    category?: { id: string; nombre: string; icon: string | null } | null;
    createdAt: string;
    creator?: { name: string } | null;
}

interface Sesion {
    id: string;
    montoApertura: string;
    montoCierre: string | null;
    saldoEsperado: string | null;
    discrepancia: string | null;
    estado: "abierta" | "cerrada";
    openedAt: string;
    closedAt: string | null;
    user: { name: string };
    movimientos: Movimiento[];
}

interface CajaDetail {
    id: string;
    nombre: string;
    tipo: "principal" | "chica";
    saldoActual: string;
    cuentaContable: string | null;
    limiteMaximo: string | null;
    isActive: boolean;
    sesiones: Sesion[];
}

const MOVEMENT_LABELS: Record<string, { label: string; color: string }> = {
    ingreso: { label: "Ingreso", color: "text-emerald-600" },
    gasto: { label: "Gasto", color: "text-red-600" },
    traspaso_entrada: { label: "Traspaso Entrada", color: "text-blue-600" },
    traspaso_salida: { label: "Traspaso Salida", color: "text-orange-600" },
    ajuste_sobrante: { label: "Ajuste (Sobrante)", color: "text-emerald-500" },
    ajuste_faltante: { label: "Ajuste (Faltante)", color: "text-red-500" },
};

const MOVEMENT_ICONS: Record<string, typeof TrendingUp> = {
    ingreso: TrendingUp,
    gasto: TrendingDown,
    traspaso_entrada: ArrowRightLeft,
    traspaso_salida: ArrowRightLeft,
    ajuste_sobrante: CheckCircle2,
    ajuste_faltante: AlertTriangle,
};

export default function CajaDetailPage() {
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();

    const [openSessionOpen, setOpenSessionOpen] = useState(false);
    const [closeSessionOpen, setCloseSessionOpen] = useState(false);
    const [movOpen, setMovOpen] = useState(false);

    const [montoApertura, setMontoApertura] = useState("");
    const [montoCierre, setMontoCierre] = useState("");
    const [movTipo, setMovTipo] = useState<"ingreso" | "gasto">("ingreso");
    const [movMonto, setMovMonto] = useState("");
    const [movCategoryId, setMovCategoryId] = useState("");
    const [movConcepto, setMovConcepto] = useState("");
    const [movReferencia, setMovReferencia] = useState("");

    const { data: categories } = useQuery<any[]>({
        queryKey: ["transaction-categories"],
        queryFn: async () => {
            const { data } = await axios.get("/api/transaction-categories");
            return data;
        },
    });

    const { data: caja, isLoading } = useQuery<CajaDetail>({
        queryKey: ["caja", id],
        queryFn: async () => {
            const { data } = await axios.get(`/api/cajas/${id}`);
            return data;
        },
    });

    const openSession = caja?.sesiones.find((s) => s.estado === "abierta");

    const openSessionMutation = useMutation({
        mutationFn: async (values: { montoApertura: string; userId?: string }) => {
            const { data } = await axios.post(`/api/cajas/${id}/sesiones`, values);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["caja", id] });
            queryClient.invalidateQueries({ queryKey: ["cajas"] });
            setOpenSessionOpen(false);
            setMontoApertura("");
        },
    });

    const closeSessionMutation = useMutation({
        mutationFn: async (values: { montoCierre: string }) => {
            const { data } = await axios.patch(
                `/api/cajas/${id}/sesiones/${openSession?.id}`,
                values,
            );
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["caja", id] });
            queryClient.invalidateQueries({ queryKey: ["cajas"] });
            queryClient.invalidateQueries({ queryKey: ["cajas-stats"] });
            setCloseSessionOpen(false);
            setMontoCierre("");
        },
    });

    const movMutation = useMutation({
        mutationFn: async (values: {
            tipo: string;
            monto: string;
            concepto: string;
            categoryId?: string;
            referencia?: string;
        }) => {
            const { data } = await axios.post(
                `/api/cajas/${id}/sesiones/${openSession?.id}/movimientos`,
                values,
            );
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["caja", id] });
            queryClient.invalidateQueries({ queryKey: ["cajas"] });
            queryClient.invalidateQueries({ queryKey: ["cajas-stats"] });
            setMovOpen(false);
            setMovMonto("");
            setMovCategoryId("");
            setMovConcepto("");
            setMovReferencia("");
        },
    });

    const handleOpenSession = () => {
        openSessionMutation.mutate({ montoApertura });
    };

    const handleCloseSession = () => {
        closeSessionMutation.mutate({ montoCierre });
    };

    const handleMovimiento = () => {
        movMutation.mutate({
            tipo: movTipo,
            monto: movMonto,
            categoryId: movCategoryId || undefined,
            concepto: movConcepto,
            referencia: movReferencia || undefined,
        });
    };

    if (isLoading) {
        return (
            <div className="p-6 h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (!caja) {
        return (
            <div className="p-6 text-center">
                <p className="text-muted-foreground">Caja no encontrada</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/cajas">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <Vault className="h-5 w-5 text-primary" />
                            <h1 className="text-2xl font-bold">{caja.nombre}</h1>
                            <Badge
                                variant={caja.tipo === "principal" ? "default" : "secondary"}
                            >
                                {caja.tipo === "principal" ? "Principal" : "Chica"}
                            </Badge>
                        </div>
                        {caja.cuentaContable && (
                            <p className="text-sm text-muted-foreground mt-1">
                                Cuenta contable: {caja.cuentaContable}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex gap-2">
                    {openSession ? (
                        <>
                            <Dialog open={movOpen} onOpenChange={setMovOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline">
                                        <Plus className="mr-2 h-4 w-4" /> Movimiento
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Registrar Movimiento</DialogTitle>
                                        <DialogDescription>
                                            Registra un ingreso o gasto en la sesión activa.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label>Tipo</Label>
                                            <Select
                                                value={movTipo}
                                                onValueChange={(v) =>
                                                    setMovTipo(v as "ingreso" | "gasto")
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ingreso">
                                                        <span className="flex items-center gap-2">
                                                            <TrendingUp className="h-4 w-4 text-emerald-500" />{" "}
                                                            Ingreso
                                                        </span>
                                                    </SelectItem>
                                                    <SelectItem value="gasto">
                                                        <span className="flex items-center gap-2">
                                                            <TrendingDown className="h-4 w-4 text-red-500" />{" "}
                                                            Gasto
                                                        </span>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Monto</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                placeholder="0.00"
                                                value={movMonto}
                                                onChange={(e) => setMovMonto(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Concepto / Categoría</Label>
                                            <Select
                                                value={movCategoryId}
                                                onValueChange={(v) => {
                                                    setMovCategoryId(v);
                                                    const cat = categories?.find(c => c.id === v);
                                                    if (cat) setMovConcepto(cat.nombre);
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccionar concepto" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories
                                                        ?.filter(c => c.tipo === movTipo)
                                                        .map(cat => (
                                                            <SelectItem key={cat.id} value={cat.id}>
                                                                {cat.nombre}
                                                            </SelectItem>
                                                        ))}
                                                    <SelectItem value="manual">Otro (especificar manual)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {movCategoryId === "manual" && (
                                            <div className="grid gap-2">
                                                <Label>Descripción Manual</Label>
                                                <Input
                                                    placeholder="Ej: Ajuste por redondeo"
                                                    value={movConcepto}
                                                    onChange={(e) => setMovConcepto(e.target.value)}
                                                />
                                            </div>
                                        )}
                                        <div className="grid gap-2">
                                            <Label>Referencia (opcional)</Label>
                                            <Input
                                                placeholder="Ej: Factura #001"
                                                value={movReferencia}
                                                onChange={(e) => setMovReferencia(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            onClick={handleMovimiento}
                                            disabled={
                                                movMutation.isPending || !movMonto || !movConcepto
                                            }
                                        >
                                            {movMutation.isPending
                                                ? "Registrando..."
                                                : "Registrar Movimiento"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Dialog open={closeSessionOpen} onOpenChange={setCloseSessionOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="destructive">
                                        <Square className="mr-2 h-4 w-4" /> Cerrar Sesión
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Cerrar Sesión de Caja</DialogTitle>
                                        <DialogDescription>
                                            Ingresa el conteo físico final del dinero en la caja. El
                                            sistema calculará si hay alguna discrepancia.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    Monto apertura:
                                                </span>
                                                <span className="font-medium">
                                                    $
                                                    {Number(openSession.montoApertura).toLocaleString(
                                                        "es-DO",
                                                        { minimumFractionDigits: 2 },
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    Saldo sistema:
                                                </span>
                                                <span className="font-medium">
                                                    $
                                                    {Number(caja.saldoActual).toLocaleString("es-DO", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Conteo Físico (Monto de Cierre)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                value={montoCierre}
                                                onChange={(e) => setMontoCierre(e.target.value)}
                                            />
                                        </div>
                                        {montoCierre && (
                                            <div className="rounded-lg border p-3">
                                                {Number(montoCierre) ===
                                                    Number(caja.saldoActual) ? (
                                                    <div className="flex items-center gap-2 text-emerald-600">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        <span className="text-sm font-medium">
                                                            Sin discrepancia
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-amber-600">
                                                        <AlertTriangle className="h-4 w-4" />
                                                        <span className="text-sm font-medium">
                                                            Discrepancia: $
                                                            {Math.abs(
                                                                Number(montoCierre) -
                                                                Number(caja.saldoActual),
                                                            ).toFixed(2)}{" "}
                                                            (
                                                            {Number(montoCierre) >
                                                                Number(caja.saldoActual)
                                                                ? "sobrante"
                                                                : "faltante"}
                                                            )
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            variant="destructive"
                                            onClick={handleCloseSession}
                                            disabled={
                                                closeSessionMutation.isPending || !montoCierre
                                            }
                                        >
                                            {closeSessionMutation.isPending
                                                ? "Cerrando..."
                                                : "Confirmar Cierre"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </>
                    ) : (
                        <Dialog open={openSessionOpen} onOpenChange={setOpenSessionOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Play className="mr-2 h-4 w-4" /> Abrir Sesión
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Abrir Sesión de Caja</DialogTitle>
                                    <DialogDescription>
                                        Ingresa el monto físico contado al inicio del turno.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label>Monto de Apertura</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            value={montoApertura}
                                            onChange={(e) => setMontoApertura(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        onClick={handleOpenSession}
                                        disabled={
                                            openSessionMutation.isPending || !montoApertura
                                        }
                                    >
                                        {openSessionMutation.isPending
                                            ? "Abriendo..."
                                            : "Abrir Sesión"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            {/* Caja Info Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Saldo Actual
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">
                            $
                            {Number(caja.saldoActual).toLocaleString("es-DO", {
                                minimumFractionDigits: 2,
                            })}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Estado
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {openSession ? (
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                                </span>
                                <span className="text-lg font-semibold text-emerald-600">
                                    Sesión Abierta
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full bg-gray-300" />
                                <span className="text-lg font-semibold text-muted-foreground">
                                    Cerrada
                                </span>
                            </div>
                        )}
                        {openSession && (
                            <p className="text-sm text-muted-foreground mt-1">
                                Operador: {openSession.user.name}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {caja.tipo === "chica" ? "Límite Máximo" : "Tipo de Caja"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {caja.tipo === "chica" && caja.limiteMaximo ? (
                            <p className="text-3xl font-bold">
                                $
                                {Number(caja.limiteMaximo).toLocaleString("es-DO", {
                                    minimumFractionDigits: 2,
                                })}
                            </p>
                        ) : (
                            <p className="text-lg font-semibold capitalize">{caja.tipo}</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Active Session Movements */}
            {openSession && openSession.movimientos.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Movimientos de la Sesión Activa</CardTitle>
                        <CardDescription>
                            Apertura: $
                            {Number(openSession.montoApertura).toLocaleString("es-DO", {
                                minimumFractionDigits: 2,
                            })}{" "}
                            · {openSession.movimientos.length} movimiento(s)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-hidden rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Concepto</TableHead>
                                        <TableHead>Referencia</TableHead>
                                        <TableHead className="text-right">Monto</TableHead>
                                        <TableHead>Fecha</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {openSession.movimientos.map((mov) => {
                                        const meta = MOVEMENT_LABELS[mov.tipo] || {
                                            label: mov.tipo,
                                            color: "",
                                        };
                                        const Icon = MOVEMENT_ICONS[mov.tipo] || Clock;
                                        const isPositive = ["ingreso", "traspaso_entrada", "ajuste_sobrante"].includes(mov.tipo);

                                        return (
                                            <TableRow key={mov.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Icon className={`h-4 w-4 ${meta.color}`} />
                                                        <Badge
                                                            variant="outline"
                                                            className={meta.color}
                                                        >
                                                            {meta.label}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    <div className="flex flex-col">
                                                        <span>{mov.concepto}</span>
                                                        {mov.category && (
                                                            <span className="text-[10px] text-muted-foreground uppercase">{mov.category.nombre}</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {mov.referencia || "—"}
                                                </TableCell>
                                                <TableCell
                                                    className={`text-right font-semibold ${isPositive ? "text-emerald-600" : "text-red-600"}`}
                                                >
                                                    {isPositive ? "+" : "-"}$
                                                    {Number(mov.monto).toLocaleString("es-DO", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {new Date(mov.createdAt).toLocaleString("es-DO")}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Session History */}
            <Card>
                <CardHeader>
                    <CardTitle>Historial de Sesiones</CardTitle>
                    <CardDescription>
                        Últimas sesiones de esta caja con sus resultados.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {caja.sesiones.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            No hay sesiones registradas.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {caja.sesiones.map((sesion) => (
                                <div
                                    key={sesion.id}
                                    className="rounded-lg border p-4 space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {sesion.estado === "abierta" ? (
                                                <Badge className="bg-emerald-500">Abierta</Badge>
                                            ) : (
                                                <Badge variant="secondary">Cerrada</Badge>
                                            )}
                                            <span className="text-sm font-medium">
                                                {sesion.user.name}
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(sesion.openedAt).toLocaleString("es-DO")}
                                            {sesion.closedAt &&
                                                ` — ${new Date(sesion.closedAt).toLocaleString("es-DO")}`}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Apertura</p>
                                            <p className="font-semibold">
                                                $
                                                {Number(sesion.montoApertura).toLocaleString("es-DO", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </p>
                                        </div>
                                        {sesion.montoCierre && (
                                            <div>
                                                <p className="text-muted-foreground">Cierre</p>
                                                <p className="font-semibold">
                                                    $
                                                    {Number(sesion.montoCierre).toLocaleString("es-DO", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </p>
                                            </div>
                                        )}
                                        {sesion.saldoEsperado && (
                                            <div>
                                                <p className="text-muted-foreground">Esperado</p>
                                                <p className="font-semibold">
                                                    $
                                                    {Number(sesion.saldoEsperado).toLocaleString(
                                                        "es-DO",
                                                        { minimumFractionDigits: 2 },
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                        {sesion.discrepancia && (
                                            <div>
                                                <p className="text-muted-foreground">Discrepancia</p>
                                                <p
                                                    className={`font-semibold ${Number(sesion.discrepancia) === 0 ? "text-emerald-600" : "text-amber-600"}`}
                                                >
                                                    {Number(sesion.discrepancia) > 0 ? "+" : ""}$
                                                    {Number(sesion.discrepancia).toLocaleString("es-DO", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {sesion.movimientos.length > 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            {sesion.movimientos.length} movimiento(s) registrados
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
