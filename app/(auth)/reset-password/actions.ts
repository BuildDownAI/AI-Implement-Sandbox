"use server";

import { toFieldErrors, type FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { resetPasswordSchema } from "./schema";
import { revalidatePath } from "next/cache";

export async function updatePassword(_prevState: FormState, formData: FormData): Promise<FormState> {
    const result = resetPasswordSchema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
        return { fieldErrors: toFieldErrors(result.error) };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password: result.data.password });
    if (error) {
        return { error: error.message };
    }

    revalidatePath("/", "layout");
    redirect("/");
}