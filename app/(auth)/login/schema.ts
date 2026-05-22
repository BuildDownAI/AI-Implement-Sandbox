import { z } from "zod";
import { emailField, passwordField } from "@/lib/schemas/auth-fields";

export const loginSchema = z.object({
    email: emailField,
    password: passwordField,
});

export const registerSchema = z.object({
    email: emailField,
    password: passwordField,
});