"use client";

import { Button } from "@/components/ui/button";

export default function AuthError({ error, reset }: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex flex-col items-center gap-4 text-center">
            <h1 className="text-2xl font-bold"> Something went wrong </h1>

            <p className="text-sm text-muted-foreground">
                {error.message || "An unexpected error occurred."}
            </p>

            <Button onClick={reset}> Try again </Button>
        </div>
    );
}