"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { UserPlus, Users, Phone, IdCard, Wallet } from "lucide-react";

import { ClientForm } from "../client-form";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Client {
    id: string;
    firstName: string;
    lastName: string;
    cedula: string;
    phone: string;
    creditLimit: string;
    imageUrl: string;
    createdAt: string;
    status: string;
}

export default function CrearClientePage() {
    const { data: clients = [], isLoading } = useQuery<Client[]>({
        queryKey: ["clients"],
        queryFn: async () => {
            const { data } = await axios.get("/api/clients");
            return data.slice(0, 5); // Only latest 5
        },
    });

    const columns: ColumnDef<Client>[] = [
        {
            id: "avatar",
            header: "",
            cell: ({ row }) => (
                <Avatar className="h-8 w-8">
                    <AvatarImage src={row.original.imageUrl} />
                    <AvatarFallback>{row.original.firstName[0]}</AvatarFallback>
                </Avatar>
            ),
        },
        {
            header: "Cliente",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium text-sm">{row.original.firstName} {row.original.lastName}</span>
                    <span className="text-[10px] text-muted-foreground">{row.original.cedula}</span>
                </div>
            ),
        },
        {
            accessorKey: "phone",
            header: "Teléfono",
            cell: ({ row }) => <span className="text-xs">{row.original.phone}</span>,
        },
        {
            header: "Límite",
            cell: ({ row }) => (
                <Badge variant="outline" className="font-mono text-[10px]">
                    ${Number(row.original.creditLimit || 0).toLocaleString()}
                </Badge>
            ),
        },
        {
            header: "Registrado",
            cell: ({ row }) => (
                <span className="text-[10px] text-muted-foreground uppercase">
                    {format(new Date(row.original.createdAt), "dd MMM yyyy", { locale: es })}
                </span>
            ),
        },
    ];

    const table = useDataTableInstance({
        data: clients,
        columns,
        getRowId: (row) => row.id,
    });

    return (
        <div className="flex flex-col gap-6 p-6 mx-auto w-full max-w-7xl">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Clientes</h1>
                <p className="text-muted-foreground">
                    Registra nuevos clientes yvisualiza los ingresos más recientes.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Section */}
                <Card className="lg:col-span-1 border-none shadow-lg bg-card/50 backdrop-blur-sm h-fit">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-primary" />
                            Nuevo Cliente
                        </CardTitle>
                        <CardDescription>
                            Complete los datos para dar de alta al cliente.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ClientForm />
                    </CardContent>
                </Card>

                {/* Recent Clients Section */}
                <Card className="lg:col-span-2 border-none shadow-md bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Ingresos Recientes
                        </CardTitle>
                        <CardDescription>Visualización de los últimos 5 clientes registrados.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border bg-background/50 overflow-hidden">
                            <DataTable
                                table={table}
                                columns={columns}
                                isLoading={isLoading}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
