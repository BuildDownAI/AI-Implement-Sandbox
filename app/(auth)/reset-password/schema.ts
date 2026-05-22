import { z } from "zod";
import { passwordField } from "@/lib/schemas/auth-fields";

export const resetPasswordSchema = z.object({
    password: passwordField,
});