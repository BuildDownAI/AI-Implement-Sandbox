import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold">Hello World</h1>
      <p className="max-w-prose text-center text-muted-foreground">
        This page is served by a minimal Next.js + shadcn application used to
        validate the end-to-end AI-Implement integration. Its only purpose is
        to confirm that the scaffolding runs correctly — no real application
        logic lives here.
      </p>
      <Link
        href="/users"
        className="text-sm underline underline-offset-4 hover:text-muted-foreground"
      >
        Log in
      </Link>
      <ThemeToggle />
    </main>
  );
}
