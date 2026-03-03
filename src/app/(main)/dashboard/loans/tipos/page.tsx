"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
    Plus,
    Fingerprint,
    FileText,
    Percent,
    Calendar,
    ShieldCheck,
    Settings2,
    MoreVertical,
    Edit,
    Trash2,
    AlertTriangle
} from "lucide-react";
import { useState, useEffect } from "react";
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface LoanType {
    id: string;
    name: string;
    description: string;
    interestRateDefault: string;
    maxAmount: string | null;
    maxTermMonths: number | null;
    paymentFrequency: "weekly" | "biweekly" | "monthly";
    isActive: boolean;
}

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function LoanTypesPage() {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<LoanType | null>(null);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [interestRate, setInterestRate] = useState("");
    const [frequency, setFrequency] = useState<"weekly" | "biweekly" | "monthly">("monthly");

    // Reset form when dialogs close or when entering edit mode
    useEffect(() => {
        if (!isDialogOpen && !isDeleteDialogOpen) {
            setSelectedType(null);
            setName("");
            setDescription("");
            setInterestRate("");
        } else if (isDialogOpen && selectedType) {
            setName(selectedType.name);
            setDescription(selectedType.description || "");
            setInterestRate(selectedType.interestRateDefault);
            setFrequency(selectedType.paymentFrequency);
        }
    }, [isDialogOpen, isDeleteDialogOpen, selectedType]);

    const { data: types = [], isLoading } = useQuery<LoanType[]>({
        queryKey: ["loan-types"],
        queryFn: async () => {
            const { data } = await axios.get("/api/loan-types");
            return data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                name,
                description,
                interestRateDefault: Number(interestRate),
                paymentFrequency: frequency,
            };

            if (selectedType) {
                const { data } = await axios.patch(`/api/loan-types/${selectedType.id}`, payload);
                return data;
            } else {
                const { data } = await axios.post("/api/loan-types", payload);
                return data;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["loan-types"] });
            toast.success(selectedType ? "Tipo de préstamo actualizado" : "Tipo de préstamo creado");
            setIsDialogOpen(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data || "Error al procesar la solicitud");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { data } = await axios.delete(`/api/loan-types/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["loan-types"] });
            toast.success("Tipo de préstamo eliminado");
            setIsDeleteDialogOpen(false);
            setSelectedType(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data || "No se pudo eliminar el tipo de préstamo");
        }
    });

    const handleEdit = (type: LoanType) => {
        setSelectedType(type);
        setIsDialogOpen(true);
    };

    const handleDeleteClick = (type: LoanType) => {
        setSelectedType(type);
        setIsDeleteDialogOpen(true);
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <Fingerprint className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight">Tipos de Préstamo</h1>
                </div>
                <p className="text-muted-foreground">
                    Configure las categorías de préstamos, tasas de interés predeterminadas y condiciones.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1 border-none shadow-lg bg-card/60 backdrop-blur-md h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg">Gestión de Tipos</CardTitle>
                        <CardDescription>Cree nuevas categorías para los productos financieros.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full flex items-center gap-2 bg-primary hover:bg-primary/90 transition-all shadow-md">
                                    <Plus className="h-4 w-4" /> Nuevo Tipo de Préstamo
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] bg-card/95 backdrop-blur-xl border-primary/20">
                                <DialogHeader>
                                    <DialogTitle>{selectedType ? "Editar Categoría" : "Crear Categoría"}</DialogTitle>
                                    <DialogDescription>
                                        Defina los parámetros base para este tipo de préstamo.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Nombre</Label>
                                        <Input
                                            id="name"
                                            placeholder="Ej: Préstamo Personal"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="interest">Tasa de Interés Anual (%)</Label>
                                        <Input
                                            id="interest"
                                            type="number"
                                            step="0.01"
                                            placeholder="Ej: 18.5"
                                            value={interestRate}
                                            onChange={(e) => setInterestRate(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="description">Descripción</Label>
                                        <Input
                                            id="description"
                                            placeholder="Breve descripción del producto..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="frequency">Frecuencia de Pago</Label>
                                        <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                                            <SelectTrigger className="bg-background/50">
                                                <SelectValue placeholder="Seleccione frecuencia" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="weekly">Semanal</SelectItem>
                                                <SelectItem value="biweekly">Quincenal</SelectItem>
                                                <SelectItem value="monthly">Mensual</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                                    <Button
                                        onClick={() => createMutation.mutate()}
                                        disabled={!name || !interestRate || createMutation.isPending}
                                    >
                                        {selectedType ? "Actualizar" : "Guardar"} Categoría
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>

                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {isLoading ? (
                        <p>Cargando tipos...</p>
                    ) : types.length === 0 ? (
                        <Card className="col-span-full border-dashed p-12 flex flex-col items-center justify-center text-center">
                            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="font-semibold text-lg">No hay tipos configurados</h3>
                            <p className="text-muted-foreground">Comience creando su primera categoría de préstamo.</p>
                        </Card>
                    ) : types.map((type) => (
                        <Card key={type.id} className="border-none shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300">
                            <div className="h-1.5 bg-primary w-full" />
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-center w-full">
                                    <CardTitle className="text-xl font-bold">{type.name}</CardTitle>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={type.isActive ? "default" : "secondary"} className="h-fit">
                                            {type.isActive ? "Activo" : "Inactivo"}
                                        </Badge>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40 bg-card/95 backdrop-blur-xl border-primary/20">
                                                <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground">Opciones</DropdownMenuLabel>
                                                <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-primary focus:text-primary-foreground" onClick={() => handleEdit(type)}>
                                                    <Edit className="h-4 w-4" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="gap-2 text-red-600 focus:bg-red-600 focus:text-white cursor-pointer" onClick={() => handleDeleteClick(type)}>
                                                    <Trash2 className="h-4 w-4" /> Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                <CardDescription className="line-clamp-2 mt-1">{type.description || "Sin descripción"}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Percent className="h-4 w-4 text-primary" />
                                        <span>Tasa Base: <span className="text-foreground font-semibold">{type.interestRateDefault}%</span></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4 text-primary" />
                                        <span>Frecuencia: <span className="text-foreground font-semibold capitalize">
                                            {type.paymentFrequency === 'weekly' ? 'Semanal' :
                                                type.paymentFrequency === 'biweekly' ? 'Quincenal' : 'Mensual'}
                                        </span></span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                                            <Settings2 className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Condiciones</span>
                                            <span className="font-semibold">
                                                {type.maxTermMonths ? `Hasta ${type.maxTermMonths} meses` : "Plazo flexible"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-red-500/20">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" /> Confirmar Eliminación
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Está seguro que desea eliminar el tipo de préstamo <strong>{selectedType?.name}</strong>?
                            Esta acción no se puede deshacer y fallará si existen préstamos asociados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white shadow-lg"
                            onClick={() => selectedType && deleteMutation.mutate(selectedType.id)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? "Eliminando..." : "Eliminar Definitivamente"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
