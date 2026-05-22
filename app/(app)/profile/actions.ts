"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { emailSchema, passwordSchema, profileSchema } from "./schema";
import { Database } from "@/lib/supabase/database.types";
import { revalidatePath } from "next/cache";
import { type FormState, toFieldErrors } from "@/lib/form-state";

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

const ALLOWED_FILE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export async function updateProfile(_prevState: FormState, formData: FormData): Promise<FormState> {
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    const userId = claimsData?.claims.sub;
    if (!userId) redirect("/login");

    // display name input validation
    const { avatar, ...updateForm } = Object.fromEntries(formData); 
    const result = profileSchema.safeParse(updateForm);
    if (!result.success) {
        return { fieldErrors: toFieldErrors(result.error) };
    }

    // store updates to send (avatar_path added later if that was changed)
    const updates: ProfileUpdate = {
        display_name: result.data.display_name || null,
        updated_at: new Date().toISOString()
    };

    // avatar input validation / upload to storage if valid
    if (avatar instanceof File && avatar.size > 0) {
        if (!ALLOWED_FILE_TYPES.includes(avatar.type)) {
            return { fieldErrors: { avatar: "Avatar must be PNG, JPEG, WebP, or GIF" }};
        }
        if (avatar.size > MAX_AVATAR_BYTES) {
            return { fieldErrors: { avatar: "Avatar must be 5 MB or smaller" }};
        }

        // uploading avatar to storage
        const fileExtension = avatar.name.includes(".") ? avatar.name.split(".").pop() : avatar.type.split("/")[1];
        const path = `${userId}/${Date.now()}.${fileExtension}`;

        const { error: uploadError } = await supabase.storage.from("avatars")
            .upload(path, avatar, { contentType: avatar.type });
        if (uploadError) {
            return { error: uploadError.message };
        }

        updates.avatar_path = path;
    }

    // update the user's profile
    const { error } = await supabase.from("profiles")
        .update(updates)
        .eq("user_id", userId);
    if (error) {
        return { error: error.message };
    }

    revalidatePath("/profile");
    return { message: "Profile updated" };
}

export async function updateEmail(_prevState: FormState, formData: FormData): Promise<FormState> {
    const SITE_URL = process.env.SITE_URL;
    if (!SITE_URL) {
        throw new Error("SITE_URL env var is required");
    }
    
    const result = emailSchema.safeParse({ email: formData.get("email") });
    if (!result.success) {
        return { fieldErrors: toFieldErrors(result.error) };
    }
    
    // reject no-op where the user submits their current email
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    const currentEmail = claimsData?.claims.email;
    if (result.data.email.toLowerCase() === currentEmail?.toLowerCase()) {
        return { fieldErrors: { email: "Updated email address must be different than your current email address" }};
    }

    const { error } = await supabase.auth.updateUser(
        { email: result.data.email },
        { emailRedirectTo: `${SITE_URL}/auth/confirm` }
    );
    if (error) {
        return { error: error.message };
    }

    return {
        message: "Confirmation links sent to both your current and new email addresses. Click both to complete the change."
    };
}

export async function updatePassword(_prevState: FormState, formData: FormData): Promise<FormState> {
    const result = passwordSchema.safeParse({ password: formData.get("password") });
    if (!result.success) {
        return { fieldErrors: toFieldErrors(result.error) };
    }
    
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password: result.data.password });
    if (error) {
        return { error: error.message };
    }
    
    return { message: "Password updated" };
}

export async function deleteAccount(): Promise<FormState> {
    const supabase = await createClient();
    const { error: rpcError } = await supabase.rpc("delete_current_user");
    if (rpcError) {
        return { error: rpcError.message };
    }

    await supabase.auth.signOut();
    redirect("/login");
}