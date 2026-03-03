"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
    Banknote,
    User,
    Calendar,
    Percent,
    Calculator,
    Table as TableIcon,
    ArrowRight,
    Fingerprint,
    CheckCircle2,
    Info
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { calculateAmortization } from "@/lib/utils/amortization";
import { Badge } from "@/components/ui/badge";

interface Client {
    id: string;
    firstName: string;
    lastName: string;
    cedula: string;
}

interface LoanType {
    id: string;
    name: string;
    interestRateDefault: string;
    paymentFrequency: "weekly" | "biweekly" | "monthly";
}

export default function LoanApplicationPage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    // Form State
    const [clientId, setClientId] = useState("");
    const [loanTypeId, setLoanTypeId] = useState("");
    const [amount, setAmount] = useState<number>(0);
    const [interestRate, setInterestRate] = useState<number>(0);
    const [termMonths, setTermMonths] = useState<number>(12);
    const [method, setMethod] = useState<'french' | 'german'>('french');
    const [paymentFrequency, setPaymentFrequency] = useState<"weekly" | "biweekly" | "monthly">("monthly");
    const [purpose, setPurpose] = useState("");
    const [firstPaymentDate, setFirstPaymentDate] = useState("");

    // Fetch Data
    const { data: clients = [] } = useQuery<Client[]>({
        queryKey: ["clients"],
        queryFn: async () => {
            const { data } = await axios.get("/api/clients");
            return data;
        },
    });

    const { data: loanTypes = [] } = useQuery<LoanType[]>({
        queryKey: ["loan-types"],
        queryFn: async () => {
            const { data } = await axios.get("/api/loan-types");
            return data;
        },
    });

    // Auto-fill interest rate when type changes
    const onLoanTypeChange = (id: string) => {
        setLoanTypeId(id);
        const selected = (loanTypes as LoanType[]).find(t => t.id === id);
        if (selected) {
            setInterestRate(Number(selected.interestRateDefault));
            setPaymentFrequency(selected.paymentFrequency);
        }
    };

    // Calculate Preview
    const previewSchedule = useMemo(() => {
        if (amount > 0 && interestRate > 0 && termMonths > 0) {
            return calculateAmortization(amount, interestRate, termMonths, method, new Date(), paymentFrequency);
        }
        return [];
    }, [amount, interestRate, termMonths, method, paymentFrequency]);

    const createLoanMutation = useMutation({
        mutationFn: async () => {
            const { data } = await axios.post("/api/loans", {
                clientId,
                loanTypeId,
                amount,
                interestRate,
                termMonths,
                method,
                paymentFrequency,
                purpose,
                firstPaymentDate: firstPaymentDate || undefined,
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["loans"] });
            toast.success("Solicitud de préstamo enviada exitosamente");
            router.push("/dashboard/loans/listado");
        },
        onError: () => {
            toast.error("Error al procesar la solicitud");
        }
    });

    return (
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <Banknote className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight">Nueva Solicitud</h1>
                </div>
                <p className="text-muted-foreground"> Complete los datos para generar una nueva solicitud de crédito.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <Card className="lg:col-span-1 border-none shadow-xl bg-card/60 backdrop-blur-md h-fit">
                    <CardHeader className="border-b bg-primary/5">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Calculator className="h-4 w-4 text-primary" />
                            Parámetros del Crédito
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 pt-6">
                        <div className="grid gap-2">
                            <Label className="flex items-center gap-2">
                                <User className="h-3 w-3" /> Cliente
                            </Label>
                            <Select onValueChange={setClientId} value={clientId}>
                                <SelectTrigger className="bg-background/50 border-primary/20">
                                    <SelectValue placeholder="Seleccione un cliente" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map(c => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.firstName} {c.lastName} ({c.cedula})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label className="flex items-center gap-2">
                                <Fingerprint className="h-3 w-3" /> Tipo de Préstamo
                            </Label>
                            <Select onValueChange={onLoanTypeChange} value={loanTypeId}>
                                <SelectTrigger className="bg-background/50 border-primary/20">
                                    <SelectValue placeholder="Seleccione producto" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(loanTypes as LoanType[]).map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="flex items-center gap-2">
                                    <Banknote className="h-3 w-3" /> Monto (RD$)
                                </Label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={amount || ""}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    className="bg-background/50"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="flex items-center gap-2">
                                    <Percent className="h-3 w-3" /> Interés Anual
                                </Label>
                                <Input
                                    type="number"
                                    placeholder="%"
                                    value={interestRate || ""}
                                    onChange={(e) => setInterestRate(Number(e.target.value))}
                                    className="bg-background/50"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="flex items-center gap-2">
                                    <Calendar className="h-3 w-3" /> Plazo ({paymentFrequency === 'monthly' ? 'Meses' : 'Cuotas'})
                                </Label>
                                <Input
                                    type="number"
                                    value={termMonths}
                                    onChange={(e) => setTermMonths(Number(e.target.value))}
                                    className="bg-background/50"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Frecuencia</Label>
                                <Select onValueChange={(v: any) => setPaymentFrequency(v)} value={paymentFrequency}>
                                    <SelectTrigger className="bg-background/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="weekly">Semanal</SelectItem>
                                        <SelectItem value="biweekly">Quincenal</SelectItem>
                                        <SelectItem value="monthly">Mensual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Método de Pago</Label>
                                <Select onValueChange={(v: any) => setMethod(v)} value={method}>
                                    <SelectTrigger className="bg-background/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="french">Francés (Fijo)</SelectItem>
                                        <SelectItem value="german">Alemán (Variable)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label>Primera Cuota</Label>
                                <Input
                                    type="date"
                                    value={firstPaymentDate}
                                    onChange={(e) => setFirstPaymentDate(e.target.value)}
                                    className="bg-background/50"
                                />
                            </div>
                        </div>

                        <Button
                            className="w-full mt-4 h-12 text-lg font-bold shadow-lg"
                            onClick={() => createLoanMutation.mutate()}
                            disabled={!clientId || !loanTypeId || amount <= 0 || createLoanMutation.isPending}
                        >
                            Solicitar Préstamo <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </CardContent>
                </Card>

                {/* Preview Section */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <Card className="border-none shadow-xl bg-card/60 backdrop-blur-md overflow-hidden flex-1 flex flex-col">
                        <CardHeader className="bg-primary/5 flex flex-row items-center justify-between border-b">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <TableIcon className="h-5 w-5 text-primary" />
                                    Tabla de Amortización Estimada
                                </CardTitle>
                                <CardDescription>Resumen de cuotas proyectadas para este préstamo.</CardDescription>
                            </div>
                            {previewSchedule.length > 0 && (
                                <Badge variant="secondary" className="px-3 py-1 text-sm font-bold bg-primary/10 text-primary border-primary/20">
                                    Cuota Promedio: RD$ {method === 'french' ? previewSchedule[0].totalAmount : (amount / termMonths).toFixed(2)}
                                </Badge>
                            )}
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-auto max-h-[600px]">
                            {previewSchedule.length > 0 ? (
                                <Table>
                                    <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                                        <TableRow>
                                            <TableHead className="w-12 text-center">#</TableHead>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead className="text-right">Capital</TableHead>
                                            <TableHead className="text-right">Interés</TableHead>
                                            <TableHead className="text-right font-bold text-primary">Total Cuota</TableHead>
                                            <TableHead className="text-right text-muted-foreground">Saldo Restante</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {previewSchedule.map((row) => (
                                            <TableRow key={row.installmentNumber} className="hover:bg-primary/5 transition-colors">
                                                <TableCell className="text-center font-mono text-xs">{row.installmentNumber}</TableCell>
                                                <TableCell className="text-xs">
                                                    {new Date(row.dueDate).toLocaleDateString("es-DO", { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </TableCell>
                                                <TableCell className="text-right text-xs">RD$ {row.principalAmount.toLocaleString()}</TableCell>
                                                <TableCell className="text-right text-xs">RD$ {row.interestAmount.toLocaleString()}</TableCell>
                                                <TableCell className="text-right font-bold text-sm text-primary">RD$ {row.totalAmount.toLocaleString()}</TableCell>
                                                <TableCell className="text-right font-mono text-xs text-muted-foreground">RD$ {row.remainingBalance.toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="p-20 flex flex-col items-center justify-center text-center opacity-50">
                                    <div className="p-6 rounded-full bg-primary/5 mb-4 group-hover:scale-110 transition-transform">
                                        <Info className="h-12 w-12 text-primary" />
                                    </div>
                                    <h3 className="text-lg font-semibold">Esperando parámetros</h3>
                                    <p className="max-w-[250px] mx-auto text-sm">Ingrese el monto, tasa y plazo para visualizar la tabla de pagos.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-primary/5 border-primary/20 shadow-sm border">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-primary" /> Sugerencia
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs text-muted-foreground">
                                El sistema recomienda una tasa de interés competitiva según el mercado actual para préstamos {method === 'french' ? 'personales' : 'hipotecarios'}.
                            </CardContent>
                        </Card>
                        <Card className="bg-amber-500/5 border-amber-500/20 shadow-sm border">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-600">
                                    <Info className="h-4 w-4" /> Importante
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs text-muted-foreground">
                                Las cuotas mostradas son estimaciones. El monto final puede variar según la fecha exacta de desembolso y cargos adicionales.
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
