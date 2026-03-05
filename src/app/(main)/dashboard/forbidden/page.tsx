"use client";

import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForbiddenPage() {
    const router = useRouter();

    return (
        <div className="h-[80vh] flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-none shadow-2xl bg-card/60 backdrop-blur-sm">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 p-4 rounded-full bg-red-500/10 w-fit">
                        <ShieldAlert className="h-12 w-12 text-red-600 animate-pulse" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                        Acceso Denegado
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground leading-relaxed">
                        Lo sentimos, pero no tienes los permisos necesarios para acceder a esta sección.
                    </p>
                    <div className="p-4 bg-muted/50 rounded-lg border border-muted-foreground/10">
                        <p className="text-sm font-medium text-foreground">
                            Si crees que esto es un error, por favor comunícate con el administrador del sistema.
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6">
                    <Button
                        variant="outline"
                        className="w-full gap-2 border-primary/20 hover:bg-primary/5"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Retroceder
                    </Button>
                    <Button
                        className="w-full gap-2 shadow-lg shadow-primary/20"
                        onClick={() => router.push("/dashboard/crm")}
                    >
                        <Home className="h-4 w-4" />
                        Ir al Inicio
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
