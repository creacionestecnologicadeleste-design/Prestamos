"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import {
    UserPlus,
    Mail,
    Lock,
    User,
    ShieldCheck,
    Loader2,
    Search,
    Pencil,
    UserMinus,
    UserCheck,
    UserCircle,
    Shield,
    UsersRound,
    Trash2,
    Image as ImageIcon,
    Camera,
    Upload,
    Ban,
    CheckCircle2,
} from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/data-table";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { ColumnDef } from "@tanstack/react-table";
import { createUserSchema, updateUserSchema } from "@/lib/validations/user.schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Role {
    id: string;
    name: string;
}

interface UserWithRole {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    imageUrl?: string;
    roleId?: string;
    createdAt: string;
    role: {
        id: string;
        name: string;
    } | null;
}

export default function UserManagementPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [isMounted, setIsMounted] = useState(false);

    // File upload refs
    const createFileInputRef = useRef<HTMLInputElement>(null);
    const editFileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingFile, setIsUploadingFile] = useState(false);

    // Edit State
    const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Queries
    const { data: roles = [], isLoading: loadingRoles } = useQuery<Role[]>({
        queryKey: ["roles"],
        queryFn: async () => {
            const { data } = await axios.get("/api/roles");
            return data;
        },
    });

    const { data: users = [], isLoading: loadingUsers } = useQuery<UserWithRole[]>({
        queryKey: ["users"],
        queryFn: async () => {
            const { data } = await axios.get("/api/users");
            return data;
        },
    });

    // Forms
    const createForm = useForm({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            roleId: "",
            imageUrl: "",
        },
    });

    const editForm = useForm({
        resolver: zodResolver(updateUserSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            roleId: "",
            imageUrl: "",
            isActive: true,
        },
    });

    // Fill edit form when editingUser changes
    useEffect(() => {
        if (editingUser) {
            editForm.reset({
                name: editingUser.name,
                email: editingUser.email,
                roleId: editingUser.roleId || editingUser.role?.id || "",
                imageUrl: editingUser.imageUrl || "",
                isActive: editingUser.isActive,
                password: "",
            });
        }
    }, [editingUser, editForm]);

    // File Upload Logic
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, form: any) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith("image/")) {
            toast.error("Por favor seleccione una imagen");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("La imagen no debe superar los 5MB");
            return;
        }

        setIsUploadingFile(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const { data } = await axios.post("/api/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            form.setValue("imageUrl", data.url);
            toast.success("Imagen subida correctamente");
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Error al subir la imagen");
        } finally {
            setIsUploadingFile(false);
        }
    };

    // Mutations
    const { mutate: createUser, isPending: isCreating } = useMutation({
        mutationFn: async (values: any) => {
            const { data } = await axios.post("/api/users", values);
            return data;
        },
        onSuccess: () => {
            toast.success("Usuario creado exitosamente");
            createForm.reset();
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data || "Error al crear usuario");
        },
    });

    const { mutate: updateUser, isPending: isUpdating } = useMutation({
        mutationFn: async (values: any) => {
            const { data } = await axios.patch(`/api/users/${editingUser?.id}`, values);
            return data;
        },
        onSuccess: () => {
            toast.success("Usuario actualizado exitosamente");
            setIsEditDialogOpen(false);
            setEditingUser(null);
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data || "Error al actualizar usuario");
        },
    });

    const deleteUserMutation = useMutation({
        mutationFn: async (userId: string) => {
            const { data } = await axios.delete(`/api/users/${userId}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success("Usuario eliminado exitosamente");
        },
        onError: (error: any) => {
            toast.error(error.response?.data || "No se pudo eliminar el usuario");
        },
    });

    const toggleStatusMutation = useMutation({
        mutationFn: async ({ userId, isActive }: { userId: string, isActive: boolean }) => {
            const { data } = await axios.patch(`/api/users/${userId}`, { isActive: !isActive });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast.success("Estado actualizado");
        },
        onError: () => {
            toast.error("Error al actualizar estado");
        }
    });

    function onCreateSubmit(values: any) {
        createUser(values);
    }

    function onEditSubmit(values: any) {
        const data = { ...values };
        if (!data.password) delete data.password;
        updateUser(data);
    }

    // Table Config
    const columns: ColumnDef<UserWithRole>[] = useMemo(() => [
        {
            id: "avatar",
            header: "",
            cell: ({ row }) => (
                <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage src={row.original.imageUrl} />
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                        {row.original.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
            ),
        },
        {
            accessorKey: "name",
            header: "Nombre",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-sm">{row.original.name}</span>
                    <span className="text-[10px] text-muted-foreground">{row.original.email}</span>
                </div>
            ),
        },
        {
            accessorKey: "role",
            header: "Rol",
            cell: ({ row }) => (
                <Badge variant="outline" className="font-normal border-primary/20 bg-primary/5 text-primary">
                    <Shield className="h-3 w-3 mr-1" />
                    {row.original.role?.name || "Sin Rol"}
                </Badge>
            ),
        },
        {
            accessorKey: "isActive",
            header: "Estado",
            cell: ({ row }) => (
                <Badge variant={row.original.isActive ? "success" : "destructive"} className="h-5">
                    {row.original.isActive ? "Activo" : "Inactivo"}
                </Badge>
            ),
        },
        {
            id: "actions",
            header: "Acciones",
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setEditingUser(row.original);
                                        setIsEditDialogOpen(true);
                                    }}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar Usuario</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`h-8 w-8 ${row.original.isActive ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleStatusMutation.mutate({ userId: row.original.id, isActive: row.original.isActive });
                                    }}
                                >
                                    {row.original.isActive ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{row.original.isActive ? 'Deshabilitar Usuario' : 'Habilitar Usuario'}</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (confirm(`¿Está seguro de eliminar a ${row.original.name}?`)) {
                                            deleteUserMutation.mutate(row.original.id);
                                        }
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Eliminar Definitivamente</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            ),
        },
    ], [toggleStatusMutation, deleteUserMutation]);

    const filteredUsers = useMemo(() => {
        return users.filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const table = useDataTableInstance({
        data: filteredUsers,
        columns: columns,
        defaultPageSize: 10,
        defaultSorting: [{ id: "name", desc: false }],
        getRowId: (row) => row.id,
    });

    if (!isMounted) return null;

    return (
        <TooltipProvider delayDuration={0}>
            <div className="flex flex-col gap-6 p-6 mx-auto w-full max-w-7xl">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
                    <p className="text-muted-foreground">
                        Crea nuevos usuarios y administra el personal de Inversiones J&T.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Creation Form */}
                    <Card className="lg:col-span-1 border-none shadow-lg bg-card/50 backdrop-blur-sm h-fit">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <UserPlus className="h-5 w-5 text-primary" />
                                Nuevo Usuario
                            </CardTitle>
                            <CardDescription>
                                Complete los datos para generar un nuevo acceso.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...createForm}>
                                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                                    <div className="flex justify-center mb-6">
                                        <div
                                            className="relative group cursor-pointer"
                                            onClick={() => createFileInputRef.current?.click()}
                                        >
                                            <div className="h-24 w-24 rounded-full border-2 border-dashed border-primary/30 group-hover:border-primary flex items-center justify-center overflow-hidden bg-muted transition-all">
                                                {isUploadingFile ? (
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                ) : createForm.watch("imageUrl") ? (
                                                    <img src={createForm.watch("imageUrl")} alt="Preview" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1 text-muted-foreground group-hover:text-primary">
                                                        <Camera className="h-6 w-6" />
                                                        <span className="text-[10px] font-medium">Subir Foto</span>
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                ref={createFileInputRef}
                                                accept="image/*"
                                                onChange={(e) => handleFileUpload(e, createForm)}
                                            />
                                        </div>
                                    </div>

                                    <FormField
                                        control={createForm.control}
                                        name="imageUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>URL de Foto (opcional)</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <ImageIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input placeholder="https://..." className="pl-9 h-9" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={createForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre completo</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input placeholder="Juan Pérez" className="pl-9 h-9" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={createForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input placeholder="juan@ejemplo.com" className="pl-9 h-9" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={createForm.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Contraseña</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            type="password"
                                                            placeholder="******"
                                                            className="pl-9 h-9"
                                                            {...field}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={createForm.control}
                                        name="roleId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Rol asignado</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                    disabled={loadingRoles}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="flex items-center gap-2 h-9">
                                                            <div className="flex items-center gap-2">
                                                                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                                                                <SelectValue placeholder="Seleccionar rol" />
                                                            </div>
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {roles.map((role) => (
                                                            <SelectItem key={role.id} value={role.id}>
                                                                {role.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button type="submit" className="w-full" disabled={isCreating || isUploadingFile}>
                                        {isCreating ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Guardando...
                                            </>
                                        ) : (
                                            "Guardar Usuario"
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>

                    {/* User List */}
                    <Card className="lg:col-span-3 border-none shadow-md bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <UsersRound className="h-5 w-5 text-primary" />
                                        Panel de Usuarios
                                    </CardTitle>
                                    <CardDescription>Administra accesos y estados de cuenta.</CardDescription>
                                </div>
                                <div className="relative max-w-xs w-full">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar usuario..."
                                        className="pl-8 h-9"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border bg-background/50 overflow-hidden">
                                <DataTable
                                    table={table}
                                    columns={columns}
                                    isLoading={loadingUsers}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Edit Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Pencil className="h-5 w-5 text-blue-600" />
                                Editar Usuario
                            </DialogTitle>
                            <DialogDescription>
                                Realice los cambios necesarios para {editingUser?.name}.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...editForm}>
                            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
                                <div className="flex justify-center mb-4">
                                    <div
                                        className="relative group cursor-pointer"
                                        onClick={() => editFileInputRef.current?.click()}
                                    >
                                        <Avatar className="h-24 w-24 border-2 border-primary/20 group-hover:border-primary transition-all">
                                            {isUploadingFile ? (
                                                <div className="flex items-center justify-center w-full h-full bg-muted">
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                </div>
                                            ) : (
                                                <>
                                                    <AvatarImage src={editForm.watch("imageUrl")} />
                                                    <AvatarFallback className="text-2xl font-bold bg-muted">
                                                        {editingUser?.name.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </>
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full transition-opacity">
                                                <Upload className="h-6 w-6 text-white" />
                                            </div>
                                        </Avatar>
                                        <input
                                            type="file"
                                            className="hidden"
                                            ref={editFileInputRef}
                                            accept="image/*"
                                            onChange={(e) => handleFileUpload(e, editForm)}
                                        />
                                    </div>
                                </div>

                                <FormField
                                    control={editForm.control}
                                    name="imageUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>URL de Foto</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={editForm.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={editForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={editForm.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nueva Contraseña (opcional)</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Dejar en blanco para no cambiar" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={editForm.control}
                                    name="roleId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Rol</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar rol" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {roles.map((role) => (
                                                        <SelectItem key={role.id} value={role.id}>
                                                            {role.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => {
                                        setIsEditDialogOpen(false);
                                        setEditingUser(null);
                                    }}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={isUpdating || isUploadingFile}>
                                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Guardar Cambios
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}
