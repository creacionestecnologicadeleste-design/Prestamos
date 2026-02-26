import { z } from 'zod';

export const movimientoSchema = z.object({
    tipo: z.enum(['ingreso', 'gasto']),
    monto: z
        .string()
        .or(z.number())
        .transform((val) => Number(val))
        .refine((val) => val > 0, 'El monto debe ser mayor a 0'),
    concepto: z.string().min(1, 'El concepto es requerido').max(500),
    referencia: z.string().max(100).optional(),
});

export const traspasoSchema = z.object({
    cajaOrigenId: z.string().uuid('ID de caja origen inválido'),
    cajaDestinoId: z.string().uuid('ID de caja destino inválido'),
    monto: z
        .string()
        .or(z.number())
        .transform((val) => Number(val))
        .refine((val) => val > 0, 'El monto debe ser mayor a 0'),
    concepto: z.string().min(1, 'El concepto es requerido').max(500),
});

export type MovimientoInput = z.infer<typeof movimientoSchema>;
export type TraspasoInput = z.infer<typeof traspasoSchema>;
