"use server";

import { emptyFormState, toFieldErrors, type FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { loginSchema, registerSchema } from "./schema";

export async function login(_prevState: FormState, formData: FormData): Promise<FormState> {
    const result = loginSchema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
        return { fieldErrors: toFieldErrors(result.error) };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(result.data);
    if (error) {
        return { error: error.message };
    }
    
    revalidatePath("/", "layout");
    redirect("/");
}

export async function register(_prevState: FormState, formData: FormData): Promise<FormState> {
    const SITE_URL = process.env.SITE_URL;
    if (!SITE_URL) {
        throw new Error("SITE_URL env var is required");
    }
    
    const result = registerSchema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
        return { fieldErrors: toFieldErrors(result.error) };
    }
    
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: { emailRedirectTo: `${SITE_URL}/auth/confirm` },
    });
    if (error) { 
        return { error: error.message };
    }

    return { message: "Check your email to confirm your account." };
}

export async function logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();

    revalidatePath("/", "layout");
    redirect("/login");
}

export async function signInWithGithub(): Promise<FormState> {
    const SITE_URL = process.env.SITE_URL;
    if (!SITE_URL) {
        throw new Error("SITE_URL env var is required");
    }
    
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
            redirectTo: `${SITE_URL}/auth/callback`,
        },
    });
    if (error) {
        return { error: error.message};
    }

    if (data.url) {
        redirect(data.url);
    }

    return emptyFormState;
}