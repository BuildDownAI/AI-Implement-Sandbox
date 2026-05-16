import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function Home() {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const user = data?.claims;

    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
            <h1 className="text-4xl font-bold">Hello World</h1>
            <p className="max-w-prose text-center text-muted-foreground">
                This page is served by a minimal Next.js + shadcn application used to
                validate the end-to-end AI-Implement integration. Its only purpose is
                to confirm that the scaffolding runs correctly — no real application
                logic lives here.
            </p>
            {user ? (
                <>
                <p className="text-muted-foreground"> Signed in as {user.email} </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button asChild>
                        <Link href="/projects"> View projects </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/profile"> View profile </Link>
                    </Button>
                    <form action={logout}>
                        <Button type="submit" variant="outline">Log out</Button>
                    </form>
                </div>
                </>
            ) : (
                <Button>
                    <Link href="/login">Log in</Link>
                </Button>
            )}
            <ThemeToggle />
        </main>
    );
}
