"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
    const supabase = await createClient();

    const credentials = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    };

    const { error } = await supabase.auth.signInWithPassword(credentials);
    // temporary error handling until inline errors are added later
    if (error) {
        redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }
    
    revalidatePath("/", "layout");
    redirect("/");
}

export async function register(formData: FormData) {
    const supabase = await createClient();

    const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";
    const credentials = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        options: {
            emailRedirectTo: `${SITE_URL}/auth/confirm`,
        },
    };

    const { error } = await supabase.auth.signUp(credentials);
    // temporary error handling until inline errors are added later
    if (error) { 
        redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }

    redirect(`/login?message=${encodeURIComponent("Check your email to confirm your account.")}`);
}

export async function logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();

    revalidatePath("/", "layout");
    redirect("/login");
}

export async function signInWithGithub() {
    const supabase = await createClient();
    const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
            redirectTo: `${SITE_URL}/auth/callback`,
        },
    });

    if (error) {
        redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }

    if (data.url) {
        redirect(data.url);
    }
}