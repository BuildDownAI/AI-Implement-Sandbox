import { createClient } from "@/lib/supabase/server";
import { getProfile } from "./profile/queries";
import { Header } from "./header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    const email = (claimsData?.claims.email as string | undefined) ?? null;
    const profile = await getProfile();

    return (
        <div className="min-h-screen flex flex-col">
            <Header profile={profile} email={email} />
            <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-8">
                {children}
            </main>
        </div>
    );
}