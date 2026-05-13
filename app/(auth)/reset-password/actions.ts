"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function updatePassword(formData: FormData) {
    const supabase = await createClient();
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.updateUser({ password });

    // only redirects errors from Supabase itself
    if (error) {
        redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
    }

    redirect(`/`);
}