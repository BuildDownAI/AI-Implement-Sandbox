"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { projectSchema } from "./schema";
import { revalidatePath } from "next/cache";
import { type FormState, toFieldErrors } from "@/lib/form-state";
import { canTransition } from "@/lib/project-status";
import type { ProjectStatus } from "@/lib/project-status";

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
    const { data: current, error: readError } = await supabase
        .from("projects")
        .select("status")
        .eq("id", id)
        .maybeSingle();
    if (readError) {
        return { error: readError.message };
    }
    if (!current) {
        return { error: "Project not found" };
    }

    if (!canTransition(current.status as ProjectStatus, result.data.status)) {
        return {
            fieldErrors: {
                status: `A project cannot move from ${current.status} to ${result.data.status}.`,
            },
        };
    }

    const { data: updated, error: writeError } = await supabase
        .from("projects")
        .update({
            ...result.data,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("status", current.status)
        .select("id");
    if (writeError) {
        return { error: writeError.message };
    }
    if (!updated || updated.length === 0) {
        return { error: "This project changed while you were editing. Reload the page and try again." };
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