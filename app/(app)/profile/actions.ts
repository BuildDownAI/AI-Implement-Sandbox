"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { emailSchema, passwordSchema, profileSchema } from "./schema";
import { Database } from "@/lib/supabase/database.types";
import { revalidatePath } from "next/cache";

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

const ALLOWED_FILE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export async function updateProfile(formData: FormData) {
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    const userId = claimsData?.claims.sub;
    if (!userId) redirect("/login");

    // display name input validation
    const result = profileSchema.safeParse({
        display_name: formData.get("display_name") || undefined
    });

    if (!result.success) {
        const message = result.error.issues[0]?.message ?? "Invalid input";
        redirect(`/profile?error=${encodeURIComponent(message)}`);
    }

    // store updates to send (avatar_path added later if that was changed)
    const updates: ProfileUpdate = {
        display_name: result.data.display_name || null,
        updated_at: new Date().toISOString()
    };

    // avatar input validation / upload if valid
    const avatar = formData.get("avatar");
    if (avatar instanceof File && avatar.size > 0) {
        if (!ALLOWED_FILE_TYPES.includes(avatar.type)) {
            redirect(`/profile?error=${encodeURIComponent("Avatar must be PNG, JPEG, WebP, or GIF")}`);
        }
        if (avatar.size > MAX_AVATAR_BYTES) {
            redirect(`/profile?error=${encodeURIComponent("Avatar must be 5 MB or smaller")}`);
        }

        // uploading avatar to storage
        const fileExtension = avatar.name.includes(".") ? avatar.name.split(".").pop() : avatar.type.split("/")[1];
        const path = `${userId}/${Date.now()}.${fileExtension}`;

        const { error: uploadError } = await supabase.storage.from("avatars")
            .upload(path, avatar, { contentType: avatar.type });
        
        if (uploadError) {
            redirect(`/profile?error=${encodeURIComponent(uploadError.message)}`);
        }

        updates.avatar_path = path;
    }

    // update the user's profile
    const { error } = await supabase.from("profiles")
        .update(updates)
        .eq("user_id", userId);
        
    if (error) {
        redirect(`/profile?error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/profile");
    redirect(`/profile?message=${encodeURIComponent("Profile updated")}`);
}

export async function updateEmail(formData: FormData) {
    const supabase = await createClient();
    const SITE_URL = process.env.SITE_URL;
    if (!SITE_URL) {
        throw new Error("SITE_URL env var is required");
    }

    const result = emailSchema.safeParse({
        email: formData.get("email")
    });
    if (!result.success) {
        const message = result.error.issues[0]?.message ?? "Invalid input";
        redirect(`/profile?error=${encodeURIComponent(message)}`);
    }

    // reject no-op where the user submits their current email
    const { data: claimsData } = await supabase.auth.getClaims();
    const currentEmail = claimsData?.claims.email;
    if (result.data.email.toLowerCase() === currentEmail?.toLowerCase()) {
        redirect(`/profile?error=${encodeURIComponent("Updated email address must be different than your current email address")}`)
    }

    const { error } = await supabase.auth.updateUser(
        { email: result.data.email },
        { emailRedirectTo: `${SITE_URL}/auth/confirm` }
    );

    if (error) {
        redirect(`/profile?error=${encodeURIComponent(error.message)}`);
    }

    redirect(`/profile?message=${encodeURIComponent("Confirmation links sent to both your current and new email addresses. Click both to complete the change.")}`);
}

export async function updatePassword(formData: FormData) {
    const supabase = await createClient();
    const result = passwordSchema.safeParse({
        password: formData.get("password")
    });
    if (!result.success) {
        const message = result.error.issues[0]?.message ?? "Invalid input";
        redirect(`/profile?error=${encodeURIComponent(message)}`);
    }

    const { error } = await supabase.auth.updateUser({
        password: result.data.password
    });

    if (error) {
        redirect(`/profile?error=${encodeURIComponent(error.message)}`);
    }
    
    redirect(`/profile?message=${encodeURIComponent("Password updated")}`);
}

export async function deleteAccount() {
    const supabase = await createClient();

    const { error: rpcError } = await supabase.rpc("delete_current_user");
    if (rpcError) {
        redirect(`/profile?error=${encodeURIComponent(rpcError.message)}`);
    }

    await supabase.auth.signOut();
    redirect(`/login?message=${encodeURIComponent("Your account has been deleted.")}`);
}