import { z } from 'zod';

export const createCajaSchema = z.object({
    nombre: z.string().min(1, 'El nombre es requerido').max(255),
    tipo: z.enum(['principal', 'chica', 'bancaria']),
    categoryId: z.string().uuid().optional().nullable(),
    cuentaContable: z.string().max(100).optional(),
    limiteMaximo: z
        .string()
        .or(z.number())
        .transform((val) => Number(val))
        .optional()
        .nullable(),
    bankName: z.string().max(100).optional().nullable(),
    accountNumber: z.string().max(100).optional().nullable(),
    accountType: z.string().max(50).optional().nullable(),
});

export const updateCajaSchema = createCajaSchema.partial();

export type CreateCajaInput = z.infer<typeof createCajaSchema>;
export type UpdateCajaInput = z.infer<typeof updateCajaSchema>;
