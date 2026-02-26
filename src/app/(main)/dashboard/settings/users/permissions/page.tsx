"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
    Key,
    ShieldCheck,
    Settings2,
    Table as TableIcon,
    Info
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface Permission {
    id: string;
    name: string;
    module: string;
    description: string;
}

export default function PermissionsPage() {
    const { data: permissions = [], isLoading } = useQuery<Permission[]>({
        queryKey: ["permissions"],
        queryFn: async () => {
            const { data } = await axios.get("/api/permissions");
            return data;
        },
    });

    const modules = Array.from(new Set(permissions.map(p => p.module)));

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Diccionario de Permisos</h1>
                <p className="text-muted-foreground">
                    Referencia técnica de todos los permisos granulares definidos en Inversiones J&T.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl font-bold text-primary">{permissions.length}</span>
                            <span className="text-xs text-muted-foreground uppercase font-semibold">Total Permisos</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-accent/5 border-accent/20">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl font-bold text-accent-foreground">{modules.length}</span>
                            <span className="text-xs text-muted-foreground uppercase font-semibold">Módulos</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {modules.map((module) => (
                <Card key={module} className="border-none shadow-sm bg-card/60">
                    <CardHeader className="py-4 bg-muted/30">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2 capitalize">
                                <Settings2 className="h-5 w-5 text-primary" />
                                Módulo: {module}
                            </CardTitle>
                            <Badge variant="secondary">{permissions.filter(p => p.module === module).length} Ítems</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">Clave de Permiso</TableHead>
                                    <TableHead>Descripción Funcional</TableHead>
                                    <TableHead className="w-[100px] text-right">ID</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {permissions.filter(p => p.module === module).map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-mono text-[10px] font-bold text-primary">
                                            {p.name}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {p.description}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Badge variant="outline" className="text-[9px] h-4">UUID</Badge>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ))}

            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-semibold mb-1">Nota de Seguridad:</p>
                    <p>Los IDs de permisos son únicos en todo el sistema y se utilizan para validaciones de nivel de API y UI. No deben exponerse a usuarios sin privilegios administrativos.</p>
                </div>
            </div>
        </div>
    );
}
