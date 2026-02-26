import { z } from 'zod';

export const openSessionSchema = z.object({
    cajaId: z.string().uuid('ID de caja inválido'),
    montoApertura: z
        .string()
        .or(z.number())
        .transform((val) => Number(val))
        .refine((val) => val >= 0, 'El monto de apertura debe ser positivo'),
});

export const closeSessionSchema = z.object({
    montoCierre: z
        .string()
        .or(z.number())
        .transform((val) => Number(val))
        .refine((val) => val >= 0, 'El monto de cierre debe ser positivo'),
});

export type OpenSessionInput = z.infer<typeof openSessionSchema>;
export type CloseSessionInput = z.infer<typeof closeSessionSchema>;
