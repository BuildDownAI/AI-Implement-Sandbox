import { z } from "zod";

export const profileSchema = z.object({
    display_name: z.string().trim()
        .max(50, "Display name must be 50 characters or less")
        .optional()
        .or(z.literal(""))
});

export const emailSchema = z.object({
    email: z.email("Must be a valid email address")
});

export const passwordSchema = z.object({
    password: z.string().min(8, "Password must be at least 8 characters")
});

export type ProfileInput = z.infer<typeof profileSchema>;