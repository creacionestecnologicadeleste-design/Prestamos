"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
    Plus,
    Trash2,
    Edit2,
    Wallet,
    Tags,
    Check,
    X,
    TrendingUp,
    TrendingDown,
    Building2,
    CreditCard,
    DollarSign,
    MoreVertical
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Category {
    id: string;
    nombre: string;
    descripcion: string | null;
    icon: string | null;
    isActive: boolean;
}

interface TransactionCategory {
    id: string;
    nombre: string;
    tipo: "ingreso" | "gasto";
    descripcion: string | null;
    isActive: boolean;
}

export default function FinancialSettingsPage() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("accounts");

    // Modal states
    const [accModalOpen, setAccModalOpen] = useState(false);
    const [transModalOpen, setTransModalOpen] = useState(false);
    const [editingAcc, setEditingAcc] = useState<Category | null>(null);
    const [editingTrans, setEditingTrans] = useState<TransactionCategory | null>(null);

    // Form states - Account Categories
    const [accNombre, setAccNombre] = useState("");
    const [accDesc, setAccDesc] = useState("");
    const [accIcon, setAccIcon] = useState("wallet");

    // Form states - Transaction Categories
    const [transNombre, setTransNombre] = useState("");
    const [transTipo, setTransTipo] = useState<"ingreso" | "gasto">("gasto");
    const [transDesc, setTransDesc] = useState("");

    // Queries
    const { data: accCategories, isLoading: loadingAcc } = useQuery<Category[]>({
        queryKey: ["account-categories"],
        queryFn: async () => {
            const { data } = await axios.get("/api/account-categories");
            return data;
        },
    });

    const { data: transCategories, isLoading: loadingTrans } = useQuery<TransactionCategory[]>({
        queryKey: ["transaction-categories"],
        queryFn: async () => {
            const { data } = await axios.get("/api/transaction-categories");
            return data;
        },
    });

    // Mutations - Account Categories
    const createAccMutation = useMutation({
        mutationFn: async (values: any) => {
            const { data } = await axios.post("/api/account-categories", values);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["account-categories"] });
            toast.success("Categoría creada");
            setAccModalOpen(false);
            resetAccForm();
        },
    });

    const updateAccMutation = useMutation({
        mutationFn: async (values: any) => {
            const { data } = await axios.patch(`/api/account-categories/${editingAcc?.id}`, values);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["account-categories"] });
            toast.success("Categoría actualizada");
            setAccModalOpen(false);
            setEditingAcc(null);
        },
    });

    const deleteAccMutation = useMutation({
        mutationFn: async (id: string) => {
            await axios.delete(`/api/account-categories/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["account-categories"] });
            toast.success("Categoría eliminada");
        },
    });

    // Mutations - Transaction Categories
    const createTransMutation = useMutation({
        mutationFn: async (values: any) => {
            const { data } = await axios.post("/api/transaction-categories", values);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transaction-categories"] });
            toast.success("Concepto creado");
            setTransModalOpen(false);
            resetTransForm();
        },
    });

    const updateTransMutation = useMutation({
        mutationFn: async (values: any) => {
            const { data } = await axios.patch(`/api/transaction-categories/${editingTrans?.id}`, values);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transaction-categories"] });
            toast.success("Concepto actualizado");
            setTransModalOpen(false);
            setEditingTrans(null);
        },
    });

    const deleteTransMutation = useMutation({
        mutationFn: async (id: string) => {
            await axios.delete(`/api/transaction-categories/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transaction-categories"] });
            toast.success("Concepto eliminado");
        },
    });

    const resetAccForm = () => {
        setAccNombre("");
        setAccDesc("");
        setAccIcon("wallet");
        setEditingAcc(null);
    };

    const resetTransForm = () => {
        setTransNombre("");
        setTransTipo("gasto");
        setTransDesc("");
        setEditingTrans(null);
    };

    const handleAccSubmit = () => {
        const payload = { nombre: accNombre, descripcion: accDesc, icon: accIcon };
        if (editingAcc) {
            updateAccMutation.mutate(payload);
        } else {
            createAccMutation.mutate(payload);
        }
    };

    const handleTransSubmit = () => {
        const payload = { nombre: transNombre, tipo: transTipo, descripcion: transDesc };
        if (editingTrans) {
            updateTransMutation.mutate(payload);
        } else {
            createTransMutation.mutate(payload);
        }
    };

    const openEditAcc = (cat: Category) => {
        setEditingAcc(cat);
        setAccNombre(cat.nombre);
        setAccDesc(cat.descripcion || "");
        setAccIcon(cat.icon || "wallet");
        setAccModalOpen(true);
    };

    const openEditTrans = (cat: TransactionCategory) => {
        setEditingTrans(cat);
        setTransNombre(cat.nombre);
        setTransTipo(cat.tipo);
        setTransDesc(cat.descripcion || "");
        setTransModalOpen(true);
    };

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Configuración Financiera</h1>
                <p className="text-muted-foreground">
                    Administra las categorías de tus cuentas y los conceptos de ingresos y gastos.
                </p>
            </div>

            <Tabs defaultValue="accounts" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="accounts" className="flex items-center gap-2">
                        <Wallet className="w-4 h-4" /> Categorías de Cuentas
                    </TabsTrigger>
                    <TabsTrigger value="transactions" className="flex items-center gap-2">
                        <Tags className="w-4 h-4" /> Conceptos de Movimientos
                    </TabsTrigger>
                </TabsList>

                {/* Account Categories Tab */}
                <TabsContent value="accounts" className="space-y-4 pt-4">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold">Tipos de Cuentas</h2>
                            <p className="text-sm text-muted-foreground">
                                Define si son bancos, efectivo, cajas fuertes, etc.
                            </p>
                        </div>
                        <Button onClick={() => { resetAccForm(); setAccModalOpen(true); }}>
                            <Plus className="w-4 h-4 mr-2" /> Nueva Categoría
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {loadingAcc ? (
                            Array(3).fill(0).map((_, i) => (
                                <Card key={i} className="animate-pulse h-32" />
                            ))
                        ) : (
                            accCategories?.map((cat) => (
                                <Card key={cat.id} className="group relative hover:border-primary/50 transition-colors">
                                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary mr-3">
                                            {cat.icon === "bank" ? <Building2 className="w-4 h-4" /> :
                                                cat.icon === "card" ? <CreditCard className="w-4 h-4" /> :
                                                    <Wallet className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-sm font-bold">{cat.nombre}</CardTitle>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEditAcc(cat)}>
                                                    <Edit2 className="w-4 h-4 mr-2" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => deleteAccMutation.mutate(cat.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {cat.descripcion || "Sin descripción"}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* Transaction Categories Tab */}
                <TabsContent value="transactions" className="space-y-4 pt-4">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold">Conceptos de Movimientos</h2>
                            <p className="text-sm text-muted-foreground">
                                Define los tipos de ingresos y gastos permitidos.
                            </p>
                        </div>
                        <Button onClick={() => { resetTransForm(); setTransModalOpen(true); }}>
                            <Plus className="w-4 h-4 mr-2" /> Nuevo Concepto
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {loadingTrans ? (
                            Array(3).fill(0).map((_, i) => (
                                <Card key={i} className="animate-pulse h-32" />
                            ))
                        ) : (
                            transCategories?.map((cat) => (
                                <Card key={cat.id} className="group hover:border-primary/50 transition-colors">
                                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg mr-3 ${cat.tipo === "ingreso" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                            }`}>
                                            {cat.tipo === "ingreso" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-sm font-bold">{cat.nombre}</CardTitle>
                                            <Badge variant="outline" className="text-[10px] uppercase font-normal py-0">
                                                {cat.tipo}
                                            </Badge>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openEditTrans(cat)}>
                                                    <Edit2 className="w-4 h-4 mr-2" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => deleteTransMutation.mutate(cat.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {cat.descripcion || "Sin descripción"}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Modals */}

            {/* Account Category Modal */}
            <Dialog open={accModalOpen} onOpenChange={setAccModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingAcc ? "Editar Categoría" : "Nueva Categoría de Cuenta"}</DialogTitle>
                        <DialogDescription>Define el tipo de cuenta y su icono representativo.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="acc-name">Nombre</Label>
                            <Input id="acc-name" value={accNombre} onChange={(e) => setAccNombre(e.target.value)} placeholder="Ej: Bancos, Efectivo..." />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="acc-icon">Icono</Label>
                            <Select value={accIcon} onValueChange={setAccIcon}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="wallet">Billetera / Efectivo</SelectItem>
                                    <SelectItem value="bank">Banco / Institución</SelectItem>
                                    <SelectItem value="card">Tarjeta de Crédito</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="acc-desc">Descripción</Label>
                            <Input id="acc-desc" value={accDesc} onChange={(e) => setAccDesc(e.target.value)} placeholder="Opcional..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAccModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAccSubmit} disabled={createAccMutation.isPending || updateAccMutation.isPending || !accNombre}>
                            {editingAcc ? "Guardar" : "Crear"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Transaction Category Modal */}
            <Dialog open={transModalOpen} onOpenChange={setTransModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingTrans ? "Editar Concepto" : "Nuevo Concepto de Movimiento"}</DialogTitle>
                        <DialogDescription>Define un concepto para categorizar ingresos y gastos.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="trans-name">Nombre</Label>
                            <Input id="trans-name" value={transNombre} onChange={(e) => setTransNombre(e.target.value)} placeholder="Ej: Alquiler, Ventas, Sueldos..." />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="trans-tipo">Tipo de Movimiento</Label>
                            <Select value={transTipo} onValueChange={(v: any) => setTransTipo(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ingreso">Ingreso</SelectItem>
                                    <SelectItem value="gasto">Gasto</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="trans-desc">Descripción</Label>
                            <Input id="trans-desc" value={transDesc} onChange={(e) => setTransDesc(e.target.value)} placeholder="Opcional..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTransModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleTransSubmit} disabled={createTransMutation.isPending || updateTransMutation.isPending || !transNombre}>
                            {editingTrans ? "Guardar" : "Crear"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
