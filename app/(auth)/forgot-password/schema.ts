import { z } from "zod";
import { emailField } from "@/lib/schemas/auth-fields";

export const forgotPasswordSchema = z.object({
    email: emailField
})