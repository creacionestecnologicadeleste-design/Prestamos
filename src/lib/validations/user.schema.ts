import { z } from "zod";

export const createUserSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    roleId: z.string().uuid("Seleccione un rol válido"),
    imageUrl: z.string().optional().or(z.literal("")),
});

export const updateUserSchema = z.object({
    name: z.string().min(3).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional().or(z.literal("")),
    roleId: z.string().uuid().optional(),
    isActive: z.boolean().optional(),
    imageUrl: z.string().optional().or(z.literal("")),
});

export const roleSchema = z.object({
    name: z.string().min(2, "El nombre del rol es requerido"),
    description: z.string().optional(),
    permissionIds: z.array(z.string().uuid()).optional(),
});
