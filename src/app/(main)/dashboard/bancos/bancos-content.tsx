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
    Building2,
    CreditCard,
    Wallet,
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
    tipo: "principal" | "chica" | "bancaria";
    categoryId: string | null;
    category?: { id: string; nombre: string; icon: string | null };
    saldoActual: string;
    cuentaContable: string | null;
    limiteMaximo: string | null;
    bankName: string | null;
    accountNumber: string | null;
    accountType: string | null;
    isActive: boolean;
    createdAt: string;
    sesiones: {
        id: string;
        estado: "abierta" | "cerrada";
        user: { name: string };
    }[];
}

interface CajaStats {
    totalEnBancos: number;
    bancosActivas: number;
    totalIngresos: number;
    totalGastos: number;
    totalMovimientos: number;
    flujoNeto: number;
}

export default function BancosContent() {
    const queryClient = useQueryClient();
    const [createOpen, setCreateOpen] = useState(false);
    const [transferOpen, setTransferOpen] = useState(false);

    // Form states
    const [nombre, setNombre] = useState("");
    const [tipo, setTipo] = useState<"principal" | "chica" | "bancaria">("bancaria");
    const [categoryId, setCategoryId] = useState("");
    const [cuentaContable, setCuentaContable] = useState("");
    const [limiteMaximo, setLimiteMaximo] = useState("");
    const [bankName, setBankName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountType, setAccountType] = useState("");

    // Transfer form states
    const [cajaOrigenId, setCajaOrigenId] = useState("");
    const [cajaDestinoId, setCajaDestinoId] = useState("");
    const [montoTraspaso, setMontoTraspaso] = useState("");
    const [conceptoTraspaso, setConceptoTraspaso] = useState("");

    const { data: bancos, isLoading } = useQuery<Caja[]>({
        queryKey: ["bancos"],
        queryFn: async () => {
            const { data } = await axios.get("/api/bancos");
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

    const { data: categories } = useQuery<any[]>({
        queryKey: ["account-categories"],
        queryFn: async () => {
            const { data } = await axios.get("/api/account-categories");
            return data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (values: any) => {
            const { data } = await axios.post("/api/bancos", values);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bancos"] });
            queryClient.invalidateQueries({ queryKey: ["cajas-stats"] });
            setCreateOpen(false);
            resetCreateForm();
        },
    });

    const transferMutation = useMutation({
        mutationFn: async (values: any) => {
            const { data } = await axios.post("/api/cajas/traspasos", values);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bancos"] });
            queryClient.invalidateQueries({ queryKey: ["cajas-stats"] });
            setTransferOpen(false);
            resetTransferForm();
        },
    });

    const resetCreateForm = () => {
        setNombre("");
        setTipo("bancaria");
        setCategoryId("");
        setCuentaContable("");
        setLimiteMaximo("");
        setBankName("");
        setAccountNumber("");
        setAccountType("");
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
            categoryId: categoryId || undefined,
            cuentaContable: cuentaContable || undefined,
            limiteMaximo: limiteMaximo || undefined,
            bankName: bankName || undefined,
            accountNumber: accountNumber || undefined,
            accountType: accountType || undefined,
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
                    <h1 className="text-2xl font-bold">Gestión de Bancos</h1>
                    <p className="text-muted-foreground text-sm font-medium">
                        Administra cuentas bancarias, efectivo y transferencias.
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
                                <DialogTitle>Traspaso entre Cuentas</DialogTitle>
                                <DialogDescription>
                                    Transfiere fondos. Ambas deben tener sesiones abiertas.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="cajaOrigen">Origen</Label>
                                    <Select value={cajaOrigenId} onValueChange={setCajaOrigenId}>
                                        <SelectTrigger id="cajaOrigen">
                                            <SelectValue placeholder="Seleccionar origen" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {bancos?.filter(c => c.sesiones.some(s => s.estado === "abierta") && c.id !== cajaDestinoId).map((c) => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {c.nombre} (${Number(c.saldoActual).toLocaleString()})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="cajaDestino">Destino</Label>
                                    <Select value={cajaDestinoId} onValueChange={setCajaDestinoId}>
                                        <SelectTrigger id="cajaDestino">
                                            <SelectValue placeholder="Seleccionar destino" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {bancos?.filter(c => c.sesiones.some(s => s.estado === "abierta") && c.id !== cajaOrigenId).map((c) => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {c.nombre} (${Number(c.saldoActual).toLocaleString()})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="montoTraspaso">Monto</Label>
                                    <Input id="montoTraspaso" type="number" step="0.01" min="0.01" value={montoTraspaso} onChange={(e) => setMontoTraspaso(e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="conceptoTraspaso">Concepto</Label>
                                    <Input id="conceptoTraspaso" placeholder="Ej: Traspaso a caja principal" value={conceptoTraspaso} onChange={(e) => setConceptoTraspaso(e.target.value)} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleTransfer} disabled={transferMutation.isPending || !cajaOrigenId || !cajaDestinoId || !montoTraspaso || !conceptoTraspaso}>
                                    {transferMutation.isPending ? "Procesando..." : "Realizar Traspaso"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Nueva Cuenta
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Crear Nueva Cuenta</DialogTitle>
                                <DialogDescription>
                                    Configura una nueva caja o cuenta bancaria.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="nombre">Nombre de la Cuenta</Label>
                                    <Input id="nombre" placeholder="Ej: BHD Pesos" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="tipo">Tipo de Gestión</Label>
                                    <Select value={tipo} onValueChange={(v) => setTipo(v as "principal" | "chica" | "bancaria")}>
                                        <SelectTrigger id="tipo">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bancaria">Cuenta Bancaria</SelectItem>
                                            <SelectItem value="principal">Caja/Cuenta Principal</SelectItem>
                                            <SelectItem value="chica">Caja Chica (con límite)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {tipo === "chica" && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="limiteMaximo">Límite Máximo</Label>
                                        <Input id="limiteMaximo" type="number" step="0.01" value={limiteMaximo} onChange={(e) => setLimiteMaximo(e.target.value)} />
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Label htmlFor="categoria">Grupo de Agrupación Visual (Opcional)</Label>
                                    <Select value={categoryId} onValueChange={setCategoryId}>
                                        <SelectTrigger id="categoria">
                                            <SelectValue placeholder="Seleccionar categoría" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories?.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id}>
                                                    {cat.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {tipo === "bancaria" && (
                                    <div className="space-y-4 pt-2 border-t mt-2">
                                        <p className="text-xs font-bold text-muted-foreground uppercase">Detalles Bancarios</p>
                                        <div className="grid gap-2">
                                            <Label htmlFor="bankName">Banco</Label>
                                            <Input id="bankName" placeholder="Ej: Banco Popular" value={bankName} onChange={(e) => setBankName(e.target.value)} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="accountNumber">Número de Cuenta</Label>
                                            <Input id="accountNumber" placeholder="Ej: 123456789" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="accountType">Tipo de Cuenta</Label>
                                            <Select value={accountType} onValueChange={setAccountType}>
                                                <SelectTrigger id="accountType">
                                                    <SelectValue placeholder="Seleccionar tipo" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ahorros">Ahorros</SelectItem>
                                                    <SelectItem value="corriente">Corriente</SelectItem>
                                                    <SelectItem value="credito">Tarjeta de Crédito</SelectItem>
                                                    <SelectItem value="dolares">Dólares</SelectItem>
                                                    <SelectItem value="digital">Billetera Digital</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreate} disabled={createMutation.isPending || !nombre}>
                                    {createMutation.isPending ? "Creando..." : "Crear Cuenta"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KPICard title="Total en Cuentas" value={stats?.totalEnBancos} icon={<DollarSign className="h-4 w-4" />} subtitle={`${stats?.bancosActivas ?? 0} cuentas activas`} />
                <KPICard title="Ingresos Totales" value={stats?.totalIngresos} icon={<TrendingUp className="h-4 w-4 text-emerald-500" />} color="text-emerald-600" />
                <KPICard title="Gastos Totales" value={stats?.totalGastos} icon={<TrendingDown className="h-4 w-4 text-red-500" />} color="text-red-600" />
                <KPICard title="Movimientos" value={stats?.totalMovimientos} icon={<Activity className="h-4 w-4" />} subtitle={`Neto: $${stats?.flujoNeto?.toLocaleString()}`} />
            </div>

            {/* Bancos Grid Grouped by Category */}
            <div className="space-y-8 pb-10">
                {!bancos || bancos.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Vault className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground text-center">No hay cuentas registradas.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {categories?.filter(c => c.icon === "bank").map(cat => {
                            const catBancos = bancos?.filter(c => c.categoryId === cat.id) || [];
                            if (catBancos.length === 0) return null;
                            return (
                                <div key={cat.id} className="space-y-4">
                                    <div className="flex items-center gap-2 border-b pb-2">
                                        <CategoryIcon icon={cat.icon} className="text-primary w-5 h-5" />
                                        <h2 className="text-lg font-bold">{cat.nombre}</h2>
                                        <Badge variant="outline" className="ml-auto">{catBancos.length}</Badge>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {catBancos.map((caja) => (
                                            <BancoCard key={caja.id} banco={caja} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {bancos.filter(c => !c.categoryId).length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b pb-2">
                                    <Wallet className="text-muted-foreground w-5 h-5" />
                                    <h2 className="text-lg font-bold">Otras Cuentas</h2>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {bancos.filter(c => !c.categoryId && c.category?.icon === "bank").map((caja) => (
                                        <BancoCard key={caja.id} banco={caja} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function KPICard({ title, value, icon, subtitle, color = "" }: any) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${color}`}>
                    ${value?.toLocaleString() ?? "0"}
                </div>
                {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </CardContent>
        </Card>
    );
}

function CategoryIcon({ icon, className }: any) {
    if (icon === "bank") return <Building2 className={className} />;
    if (icon === "card") return <CreditCard className={className} />;
    return <Wallet className={className} />;
}

function BancoCard({ banco }: { banco: Caja }) {
    const caja = banco;
    const openSession = caja.sesiones.find((s) => s.estado === "abierta");
    const saldo = Number(caja.saldoActual);
    const exceedsLimit = caja.tipo === "chica" && caja.limiteMaximo && saldo > Number(caja.limiteMaximo);

    return (
        <Link href={`/dashboard/bancos/${caja.id}`}>
            <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 relative overflow-hidden group">
                {exceedsLimit && <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500 animate-pulse" />}
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CategoryIcon icon={caja.category?.icon} className="h-5 w-5 text-primary" />
                            <CardTitle className="text-base group-hover:text-primary transition-colors">{caja.nombre}</CardTitle>
                        </div>
                        <Badge variant={caja.tipo === "principal" ? "default" : caja.tipo === "bancaria" ? "outline" : "secondary"}>
                            {caja.tipo === "principal" ? "Principal" : caja.tipo === "bancaria" ? "Bancaria" : "Chica"}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Saldo Disponible</p>
                            <p className="text-2xl font-black text-foreground">
                                ${saldo.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                            </p>
                        </div>

                        {caja.bankName && (
                            <div className="text-xs space-y-1 bg-muted/50 p-2 rounded-md">
                                <p className="font-bold flex items-center gap-1"><Building2 className="w-3 h-3" /> {caja.bankName}</p>
                                <p className="text-muted-foreground">{caja.accountNumber} · <span className="capitalize">{caja.accountType}</span></p>
                            </div>
                        )}

                        {caja.limiteMaximo && (
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Límite: ${Number(caja.limiteMaximo).toLocaleString()}</span>
                                {exceedsLimit && (
                                    <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 py-0 h-4 text-[10px]">
                                        EXCEDE LÍMITE
                                    </Badge>
                                )}
                            </div>
                        )}

                        <div className="pt-2 border-t flex items-center justify-between">
                            {openSession ? (
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                    </span>
                                    <span className="text-xs text-emerald-600 font-bold">ABIERTA</span>
                                    <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">· {openSession.user.name}</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-gray-300" />
                                    <span className="text-xs text-muted-foreground italic font-medium">SESIÓN CERRADA</span>
                                </div>
                            )}
                            {caja.cuentaContable && <span className="text-[10px] text-muted-foreground font-mono">{caja.cuentaContable}</span>}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
