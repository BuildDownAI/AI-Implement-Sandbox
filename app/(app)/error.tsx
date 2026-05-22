"use client";

import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

export default function AppError({ error, reset}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <Empty>
            <EmptyHeader>
                <EmptyTitle> Something went wrong </EmptyTitle>
                <EmptyDescription>
                    {error.message || "An unexpected error occurred."}
                </EmptyDescription>
            </EmptyHeader>

            <EmptyContent>
                <Button onClick={reset}> Try again </Button>
            </EmptyContent>
        </Empty>
    );
}