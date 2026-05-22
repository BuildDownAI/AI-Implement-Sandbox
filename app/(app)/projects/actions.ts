"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { projectSchema } from "./schema";
import { revalidatePath } from "next/cache";
import { type FormState, toFieldErrors } from "@/lib/form-state";

export async function createProject(_prevState: FormState, formData: FormData): Promise<FormState> {
    // extracts a user's ID from claims since it's not known at project creation
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    const userId = claimsData?.claims.sub;
    if (!userId) {
        redirect("/login");
    }

    const result = projectSchema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
        return { fieldErrors: toFieldErrors(result.error) };
    }

    const { data, error } = await supabase.from("projects")
        .insert({ ...result.data, user_id: userId})
        .select("id")
        .single();
    if (error) {
        return { error: error.message };
    }

    revalidatePath("/projects");
    redirect(`/projects/${data.id}`);
}

export async function updateProject(_prevState: FormState, formData: FormData): Promise<FormState> {
    const {id, ...updateForm} = Object.fromEntries(formData);
    if (typeof id !== "string" || !id) {
        return { error: "Missing project ID" };
    }

    const result = projectSchema.safeParse(updateForm);
    if (!result.success) {
        return { fieldErrors: toFieldErrors(result.error) };
    }
    
    const supabase = await createClient();
    const { error } = await supabase.from("projects")
        .update({
            ...result.data,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id);
    if (error) {
        return { error: error.message };
    }

    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    redirect(`/projects/${id}`);
}

export async function deleteProject(_prevState: FormState, formData: FormData): Promise<FormState> {
    const projectId = formData.get("id");
    if (typeof projectId !== "string" || !projectId) {
        return { error: "Missing project ID" };
    }
    
    const supabase = await createClient();
    const { error } = await supabase.from("projects").delete().eq("id", projectId);
    if (error) {
        return { error: error.message };
    }

    revalidatePath("/projects");
    redirect("/projects");
}