import { z } from "zod";

export const loanTypeSchema = z.object({
    name: z.string().min(2, "El nombre es requerido"),
    description: z.string().optional(),
    interestRateDefault: z.number().min(0, "La tasa de interés debe ser positiva"),
    maxAmount: z.number().optional().nullable(),
    maxTermMonths: z.number().int().optional().nullable(),
    paymentFrequency: z.enum(["weekly", "biweekly", "monthly"]).default("monthly"),
});

export const loanApplicationSchema = z.object({
    clientId: z.string().uuid("Seleccione un cliente válido"),
    loanTypeId: z.string().uuid("Seleccione un tipo de préstamo válido"),
    amount: z.number().min(1, "El monto debe ser mayor a 0"),
    interestRate: z.number().min(0, "La tasa de interés debe ser positiva"),
    termMonths: z.number().int().min(1, "El plazo debe ser de al menos 1 mes"),
    method: z.enum(["french", "german"]),
    paymentFrequency: z.enum(["weekly", "biweekly", "monthly"]),
    purpose: z.string().optional(),
    firstPaymentDate: z.string().optional(),
});

export const loanApprovalSchema = z.object({
    status: z.enum(["approved", "rejected"]),
    approvedAmount: z.number().optional(),
    disbursementDate: z.string().optional(),
});
export const loanUpdateSchema = z.object({
    purpose: z.string().optional(),
    loanNumber: z.string().optional(),
});
