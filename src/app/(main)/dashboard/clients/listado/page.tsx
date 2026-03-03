"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import {
    User,
    Phone,
    Mail,
    MapPin,
    Briefcase,
    Calendar,
    DollarSign,
    IdCard,
    MoreHorizontal,
    Edit,
    Trash2,
    Eye,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { type ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ClientForm } from "../client-form";

interface ClientFull {
    id: string;
    cedula: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    birthDate: string | null;
    occupation: string | null;
    monthlyIncome: string | null;
    imageUrl: string | null;
    creditLimit: string | null;
    status: "active" | "blocked" | "defaulted";
    createdAt: string;
    creator?: { name: string } | null;
    loans?: {
        id: string;
        loanNumber: string;
        amount: string;
        status: string;
    }[];
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    active: { label: "Activo", variant: "default" },
    blocked: { label: "Bloqueado", variant: "destructive" },
    defaulted: { label: "Moroso", variant: "secondary" },
};

export default function ListadoClientesPage() {
    const [selectedClient, setSelectedClient] = useState<ClientFull | null>(null);
    const [editingClient, setEditingClient] = useState<ClientFull | null>(null);

    const { data: clients, isLoading } = useQuery<ClientFull[]>({
        queryKey: ["clients"],
        queryFn: async () => {
            const { data } = await axios.get("/api/clients");
            return data;
        },
    });

    const queryClient = useQueryClient();

    const deleteClientMutation = useMutation({
        mutationFn: async (clientId: string) => {
            const { data } = await axios.delete(`/api/clients/${clientId}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            toast.success("Cliente eliminado exitosamente");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || "No se pudo eliminar el cliente");
        },
    });

    const listColumns: ColumnDef<ClientFull>[] = [
        {
            id: "avatar",
            header: "",
            cell: ({ row }) => (
                <Avatar className="h-8 w-8">
                    <AvatarImage src={row.original.imageUrl || ""} />
                    <AvatarFallback>{row.original.firstName[0]}{row.original.lastName[0]}</AvatarFallback>
                </Avatar>
            ),
        },
        {
            accessorKey: "cedula",
            header: "Cédula",
            cell: ({ row }) => (
                <span className="font-mono text-xs">{row.getValue("cedula")}</span>
            ),
        },
        {
            id: "fullName",
            header: "Nombre",
            accessorFn: (row) => `${row.firstName} ${row.lastName}`,
            cell: ({ row }) => (
                <span className="font-medium text-sm">{row.original.firstName} {row.original.lastName}</span>
            ),
        },
        {
            accessorKey: "phone",
            header: "Teléfono",
            cell: ({ row }) => <span className="text-xs">{row.getValue("phone") || "—"}</span>,
        },
        {
            accessorKey: "creditLimit",
            header: "Límite Crédito",
            cell: ({ row }) => {
                const limit = row.getValue("creditLimit") as string | null;
                return (
                    <Badge variant="outline" className="font-mono text-[10px]">
                        {limit ? `$${Number(limit).toLocaleString("es-DO")}` : "—"}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "status",
            header: "Estado",
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                const meta = STATUS_MAP[status] || { label: status, variant: "outline" as const };
                return <Badge variant={meta.variant} className="text-[10px]">{meta.label}</Badge>;
            },
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
                                        e.stopPropagation();
                                        window.location.href = `/dashboard/clients/${row.original.id}`;
                                    }}
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver Perfil Completo</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingClient(row.original);
                                    }}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar Cliente</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`¿Está seguro de desactivar a ${row.original.firstName}?`)) {
                                            deleteClientMutation.mutate(row.original.id);
                                        }
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Desactivar Cliente</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            ),
        },
    ];

    const table = useDataTableInstance({
        data: clients || [],
        columns: listColumns,
        defaultPageSize: 10,
        defaultSorting: [{ id: "fullName", desc: false }],
        getRowId: (row) => row.id,
    });

    if (isLoading) {
        return (
            <div className="p-6 h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Listado de Clientes</h1>
                    <p className="text-muted-foreground text-sm font-medium">
                        Consulta la información completa de todos los clientes registrados.
                    </p>
                </div>
            </div>

            <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Todos los Clientes</CardTitle>
                    <CardDescription>
                        Administra la información de tus clientes y visualiza sus estados.
                        {clients && ` ${clients.length} cliente(s) registrados.`}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="overflow-hidden rounded-md border bg-background/50">
                        <DataTable
                            table={table}
                            columns={listColumns}
                            isLoading={isLoading}
                            onRowClick={(row) => setSelectedClient(row.original)}
                        />
                    </div>
                    <DataTablePagination table={table} />
                </CardContent>
            </Card>

            {/* Client Detail Modal */}
            <Dialog open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
                <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                    {selectedClient && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-14 w-14">
                                        <AvatarImage src={selectedClient.imageUrl || ""} />
                                        <AvatarFallback className="text-xl font-bold">
                                            {selectedClient.firstName[0]}{selectedClient.lastName[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <DialogTitle className="text-xl">
                                            {selectedClient.firstName} {selectedClient.lastName}
                                        </DialogTitle>
                                        <DialogDescription className="text-xs text-muted-foreground">
                                            Detalles completos del perfil y estatus del cliente.
                                        </DialogDescription>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant={STATUS_MAP[selectedClient.status]?.variant || "outline"}>
                                                {STATUS_MAP[selectedClient.status]?.label || selectedClient.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </DialogHeader>

                            <Separator />

                            <div className="space-y-5">
                                {/* Identification */}
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider text-[10px]">
                                        Identificación
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <DetailItem
                                            icon={IdCard}
                                            label="Cédula"
                                            value={selectedClient.cedula}
                                        />
                                        <DetailItem
                                            icon={Calendar}
                                            label="Fecha de Nacimiento"
                                            value={
                                                selectedClient.birthDate
                                                    ? new Date(selectedClient.birthDate).toLocaleDateString("es-DO")
                                                    : null
                                            }
                                        />
                                    </div>
                                </div>

                                <Separator />

                                {/* Contact */}
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider text-[10px]">
                                        Contacto
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <DetailItem
                                            icon={Phone}
                                            label="Teléfono"
                                            value={selectedClient.phone}
                                        />
                                        <DetailItem
                                            icon={Mail}
                                            label="Email"
                                            value={selectedClient.email}
                                        />
                                        <DetailItem
                                            icon={MapPin}
                                            label="Dirección"
                                            value={selectedClient.address}
                                            fullWidth
                                        />
                                    </div>
                                </div>

                                <Separator />

                                {/* Financial */}
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider text-[10px]">
                                        Información Financiera
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <DetailItem
                                            icon={DollarSign}
                                            label="Tope de Crédito"
                                            value={
                                                selectedClient.creditLimit
                                                    ? `$${Number(selectedClient.creditLimit).toLocaleString("es-DO", { minimumFractionDigits: 2 })}`
                                                    : null
                                            }
                                        />
                                        <DetailItem
                                            icon={Briefcase}
                                            label="Ocupación"
                                            value={selectedClient.occupation}
                                        />
                                        <DetailItem
                                            icon={DollarSign}
                                            label="Ingreso Mensual"
                                            value={
                                                selectedClient.monthlyIncome
                                                    ? `$${Number(selectedClient.monthlyIncome).toLocaleString("es-DO", { minimumFractionDigits: 2 })}`
                                                    : null
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Client Modal */}
            <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Cliente</DialogTitle>
                        <DialogDescription>
                            Realiza cambios en la información del cliente.
                        </DialogDescription>
                    </DialogHeader>
                    {editingClient && (
                        <ClientForm
                            clientId={editingClient.id}
                            initialData={{
                                ...editingClient,
                                creditLimit: editingClient.creditLimit ? Number(editingClient.creditLimit) : 0,
                                monthlyIncome: editingClient.monthlyIncome ? Number(editingClient.monthlyIncome) : 0,
                                imageUrl: editingClient.imageUrl || "",
                                birthDate: editingClient.birthDate || "",
                            } as any}
                            onSuccess={() => setEditingClient(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function DetailItem({
    icon: Icon,
    label,
    value,
    fullWidth = false,
}: {
    icon: any;
    label: string;
    value: string | null | undefined;
    fullWidth?: boolean;
}) {
    return (
        <div className={`flex items-start gap-3 ${fullWidth ? "col-span-2" : ""}`}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium truncate">
                    {value || <span className="text-muted-foreground italic">No registrado</span>}
                </p>
            </div>
        </div>
    );
}
