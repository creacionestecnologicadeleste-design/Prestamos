import { z } from 'zod';

export const clientSchema = z.object({
    cedula: z.string().min(1, 'Cédula es requerida'),
    firstName: z.string().min(1, 'Nombre es requerido'),
    lastName: z.string().min(1, 'Apellido es requerido'),
    phone: z.string().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    address: z.string().optional(),
    birthDate: z.string().optional(), // Expected as YYYY-MM-DD
    occupation: z.string().optional(),
    monthlyIncome: z.string().or(z.number()).transform((val) => Number(val)).optional(),
    status: z.enum(['active', 'blocked', 'defaulted']).default('active'),
    imageUrl: z.string().optional().or(z.literal('')),
    creditLimit: z.string().or(z.number()).transform((val) => Number(val)).optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;
