"use server";

import { toFieldErrors, type FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";
import { forgotPasswordSchema } from "./schema";

export async function resetPassword(_prevState: FormState, formData: FormData): Promise<FormState> {
    const SITE_URL = process.env.SITE_URL;
    if (!SITE_URL) {
        throw new Error("SITE_URL env var is required");
    }

    const result = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
        return { fieldErrors: toFieldErrors(result.error) };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(result.data.email, {
        redirectTo: `${SITE_URL}/auth/confirm`,
    });

    if (error) {
        return { error: error.message };
    }

    // Gives the same response whether or not the email exists
    return { message: "If an account exists for that email, a reset link has been sent." };
}