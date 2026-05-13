"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function resetPassword(formData: FormData) {
    const supabase = await createClient();

    const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";
    const email = formData.get("email") as string;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${SITE_URL}/auth/confirm`,
    });

    // only redirects errors from Supabase itself
    if (error) {
        redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
    }

    // Gives the same respose on whether the email was registered or not
    redirect(`/forgot-password?message=${encodeURIComponent("If an account exists for that email, a reset link has been sent.")}`);
}