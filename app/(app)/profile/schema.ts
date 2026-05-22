import { z } from "zod";
import { emailField, passwordField } from "@/lib/schemas/auth-fields";

export const profileSchema = z.object({
    display_name: z.string().trim()
        .max(50, "Display name must be 50 characters or less")
        .optional()
        .or(z.literal(""))
});

export const emailSchema = z.object({
    email: emailField
});

export const passwordSchema = z.object({
    password: passwordField
});

export type ProfileInput = z.infer<typeof profileSchema>;