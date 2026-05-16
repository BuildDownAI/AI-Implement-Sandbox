"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function updatePassword(formData: FormData) {
    const supabase = await createClient();
    const password = formData.get("password") as string;
    const SITE_URL = process.env.SITE_URL;
    if (!SITE_URL) {
        throw new Error("SITE_URL env var is required");
    }

    const { error } = await supabase.auth.updateUser(
        { password },
        { emailRedirectTo: `${SITE_URL}/auth/confirm`}
    );

    // only redirects errors from Supabase itself
    if (error) {
        redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
    }

    redirect(`/`);
}