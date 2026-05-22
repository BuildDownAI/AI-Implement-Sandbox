import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function Home() {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const user = data?.claims;

    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
            <h1 className="text-4xl font-bold">Hello World</h1>
            <p className="max-w-prose text-center text-muted-foreground">
                This page is served by a minimal Next.js + shadcn application used to
                validate the end-to-end AI-Implement integration. Its only purpose is
                to confirm that the scaffolding runs correctly — no real application
                logic lives here.
            </p>
            {user ? (
                <p className="text-muted-foreground"> Signed in as {user.email} </p>
            ) : (
                <Button asChild>
                    <Link href="/login">Log in</Link>
                </Button>
            )}
        </div>
    );
}
