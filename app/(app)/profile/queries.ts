import { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type Profile = ProfileRow & { avatar_url: string | null };

export const getProfile = cache(async (): Promise<Profile | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase.from("profiles")
        .select("*")
        .maybeSingle();

    if (error || !data ) return null;
    const avatar_url = data.avatar_path
        ? supabase.storage.from("avatars").getPublicUrl(data.avatar_path).data.publicUrl
        : null;

    return {...data, avatar_url};
});