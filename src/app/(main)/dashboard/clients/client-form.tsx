"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import {
    Camera,
    Loader2,
    Upload,
    User,
    IdCard,
    Phone,
    Mail,
    MapPin,
    Wallet,
    Briefcase
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

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
import { clientSchema, type ClientInput } from "@/lib/validations/client.schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ClientFormProps {
    onSuccess?: () => void;
    initialData?: Partial<ClientInput>;
    clientId?: string;
}

export function ClientForm({ onSuccess, initialData, clientId }: ClientFormProps) {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const isEditing = !!clientId;

    const form = useForm<ClientInput>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            cedula: initialData?.cedula || "",
            firstName: initialData?.firstName || "",
            lastName: initialData?.lastName || "",
            phone: initialData?.phone || "",
            email: initialData?.email || "",
            address: initialData?.address || "",
            status: initialData?.status || "active",
            imageUrl: initialData?.imageUrl || "",
            creditLimit: initialData?.creditLimit || 0,
            occupation: initialData?.occupation || "",
            monthlyIncome: initialData?.monthlyIncome || 0,
        },
    });

    // Re-sync form if initialData changes (e.g. when opening edit modal for different clients)
    useEffect(() => {
        if (initialData) {
            form.reset({
                cedula: initialData.cedula || "",
                firstName: initialData.firstName || "",
                lastName: initialData.lastName || "",
                phone: initialData.phone || "",
                email: initialData.email || "",
                address: initialData.address || "",
                status: initialData.status || "active",
                imageUrl: initialData.imageUrl || "",
                creditLimit: initialData.creditLimit || 0,
                occupation: initialData.occupation || "",
                monthlyIncome: initialData.monthlyIncome || 0,
            });
        }
    }, [initialData, form]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Por favor seleccione una imagen");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const { data } = await axios.post("/api/upload", formData);
            form.setValue("imageUrl", data.url);
            toast.success("Foto subida");
        } catch (error) {
            toast.error("Error al subir imagen");
        } finally {
            setIsUploading(false);
        }
    };

    const mutation = useMutation({
        mutationFn: async (values: ClientInput) => {
            if (isEditing) {
                const { data } = await axios.patch(`/api/clients/${clientId}`, values);
                return data;
            }
            const { data } = await axios.post("/api/clients", values);
            return data;
        },
        onSuccess: () => {
            toast.success(isEditing ? "Cliente actualizado exitosamente" : "Cliente creado exitosamente");
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            if (!isEditing) form.reset();
            onSuccess?.();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || "Error al procesar la solicitud");
        },
    });

    function onSubmit(values: ClientInput) {
        mutation.mutate(values);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex justify-center flex-col items-center gap-4">
                    <div
                        className="relative group cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Avatar className="h-28 w-28 border-2 border-dashed border-muted-foreground/30 group-hover:border-primary transition-all">
                            {isUploading ? (
                                <div className="flex items-center justify-center w-full h-full">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <>
                                    <AvatarImage src={form.watch("imageUrl")} />
                                    <AvatarFallback className="bg-muted">
                                        <Camera className="h-8 w-8 text-muted-foreground" />
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
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleFileUpload}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">
                        {isEditing ? "Click para cambiar foto del cliente" : "Click para subir foto del cliente"}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Juan" className="pl-9" {...field} />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Apellido</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Pérez" className="pl-9" {...field} />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="cedula"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cédula</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <IdCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="001-0000000-0" className="pl-9" {...field} />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Teléfono</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="809-000-0000" className="pl-9" {...field} />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="creditLimit"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tope de Crédito (Max. a prestar)</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Wallet className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            placeholder="50000"
                                            className="pl-9"
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="monthlyIncome"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ingresos Mensuales</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Wallet className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            placeholder="30000"
                                            className="pl-9"
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="occupation"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel>Ocupación</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Empleado Privado" className="pl-9" {...field} />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="juan@ejemplo.com" className="pl-9" {...field} />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Dirección</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Av. Central #123" className="pl-9" {...field} />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="submit" className="w-full" disabled={mutation.isPending || isUploading}>
                    {mutation.isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {isEditing ? "Actualizando Cliente..." : "Guardando Cliente..."}
                        </>
                    ) : (
                        isEditing ? "Actualizar Cliente" : "Guardar Cliente"
                    )}
                </Button>
            </form>
        </Form>
    );
}
