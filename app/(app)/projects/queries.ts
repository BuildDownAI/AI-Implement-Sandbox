import { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectStatusEvent = Database["public"]["Tables"]["project_status_events"]["Row"];

export const getProject = cache(async (projectId: string): Promise<Project | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase.from("projects")
        .select("*")
        .eq("id", projectId)
        .maybeSingle();

    if (error) return null;

    return data;
});

export const getStatusEvents = cache(async (projectId: string): Promise<ProjectStatusEvent[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase.from("project_status_events")
        .select("*")
        .eq("project_id", projectId)
        .order("changed_at", { ascending: true });

    if (error) return [];

    return data ?? [];
});