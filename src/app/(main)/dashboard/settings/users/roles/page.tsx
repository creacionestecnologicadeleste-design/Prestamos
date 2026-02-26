"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
    ShieldCheck,
    ShieldAlert,
    ShieldQuestion,
    Plus,
    ArrowLeft,
    Settings2,
    CheckCircle2,
    Circle
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";

interface Permission {
    id: string;
    name: string;
    module: string;
    description: string;
}

interface Role {
    id: string;
    name: string;
    description: string;
    permissions: {
        permission: Permission;
    }[];
}

export default function RolesPage() {
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState("");
    const [newRoleDesc, setNewRoleDesc] = useState("");
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

    const { data: roles = [], isLoading: loadingRoles } = useQuery<Role[]>({
        queryKey: ["roles"],
        queryFn: async () => {
            const { data } = await axios.get("/api/roles");
            return data;
        },
    });

    const { data: permissions = [], isLoading: loadingPermissions } = useQuery<Permission[]>({
        queryKey: ["permissions"],
        queryFn: async () => {
            const { data } = await axios.get("/api/permissions");
            return data;
        },
    });

    const modules = Array.from(new Set(permissions.map(p => p.module)));

    const createRoleMutation = useMutation({
        mutationFn: async () => {
            const { data } = await axios.post("/api/roles", {
                name: newRoleName,
                description: newRoleDesc,
                permissionIds: selectedPermissions,
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["roles"] });
            toast.success("Rol creado exitosamente");
            setIsCreateOpen(false);
            setNewRoleName("");
            setNewRoleDesc("");
            setSelectedPermissions([]);
        },
    });

    const togglePermission = (pId: string) => {
        setSelectedPermissions(prev =>
            prev.includes(pId) ? prev.filter(id => id !== pId) : [...prev, pId]
        );
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Roles y Seguridad</h1>
                <p className="text-muted-foreground">
                    Define los niveles de acceso y permisos para cada tipo de usuario.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1 border-none shadow-md bg-card/50 backdrop-blur-sm h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            Roles Disponibles
                        </CardTitle>
                        <CardDescription>Seleccione un rol para ver detalles o cree uno nuevo.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        {roles.map((role) => (
                            <Button
                                key={role.id}
                                variant="outline"
                                className="justify-between h-auto py-3 px-4 hover:bg-accent/50 group"
                            >
                                <div className="flex flex-col items-start gap-1">
                                    <span className="font-semibold">{role.name}</span>
                                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                        {role.description}
                                    </span>
                                </div>
                                <Badge variant="secondary" className="group-hover:bg-primary group-hover:text-primary-foreground">
                                    {role.permissions.length}
                                </Badge>
                            </Button>
                        ))}

                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full mt-4 flex items-center gap-2">
                                    <Plus className="h-4 w-4" /> Nuevo Rol
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Crear Nuevo Rol</DialogTitle>
                                    <DialogDescription>
                                        Asigne un nombre y seleccione los permisos para este nuevo rol.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-6 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Nombre del Rol</Label>
                                        <Input
                                            id="name"
                                            placeholder="Ej: Auditor"
                                            value={newRoleName}
                                            onChange={(e) => setNewRoleName(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="description">Descripción</Label>
                                        <Input
                                            id="description"
                                            placeholder="Acceso de solo lectura..."
                                            value={newRoleDesc}
                                            onChange={(e) => setNewRoleDesc(e.target.value)}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Permisos del Sistema</Label>
                                        <Accordion type="multiple" className="w-full">
                                            {modules.map((module) => (
                                                <AccordionItem value={module} key={module}>
                                                    <AccordionTrigger className="capitalize py-3">
                                                        <span className="flex items-center gap-2 text-sm font-medium">
                                                            <Settings2 className="h-4 w-4 text-primary" />
                                                            Módulo: {module}
                                                        </span>
                                                    </AccordionTrigger>
                                                    <AccordionContent>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                                            {permissions.filter(p => p.module === module).map(p => (
                                                                <div key={p.id} className="flex items-start space-x-2 border rounded-lg p-2.5 hover:bg-accent/30 transition-colors">
                                                                    <Checkbox
                                                                        id={p.id}
                                                                        checked={selectedPermissions.includes(p.id)}
                                                                        onCheckedChange={() => togglePermission(p.id)}
                                                                    />
                                                                    <div className="grid gap-1.5 leading-none cursor-pointer" onClick={() => togglePermission(p.id)}>
                                                                        <label
                                                                            htmlFor={p.id}
                                                                            className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                                        >
                                                                            {p.description}
                                                                        </label>
                                                                        <span className="text-[10px] text-muted-foreground uppercase">{p.name}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                                    <Button
                                        onClick={() => createRoleMutation.mutate()}
                                        disabled={createRoleMutation.isPending || !newRoleName}
                                    >
                                        Crear Rol
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 border-none shadow-md bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <ShieldAlert className="h-5 w-5" />
                            Permisos del Sistema
                        </CardTitle>
                        <CardDescription>Referencia completa de los permisos disponibles en Inversiones J&T.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {modules.map((module) => (
                                <div key={module} className="space-y-3">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground bg-accent/30 p-2 rounded-md flex items-center justify-between">
                                        <span>Módulo {module}</span>
                                        <Badge variant="outline" className="font-mono text-[10px]">
                                            {permissions.filter(p => p.module === module).length} Permisos
                                        </Badge>
                                    </h3>
                                    <div className="grid grid-cols-1 gap-2 pl-2">
                                        {permissions.filter(p => p.module === module).map((p) => (
                                            <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg border border-transparent hover:border-border hover:bg-accent/10 transition-all">
                                                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{p.description}</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono">{p.name}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
