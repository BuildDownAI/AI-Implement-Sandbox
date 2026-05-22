import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import Link from "next/link";

export default function NotFound() {
    return (
        <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-6 p-8">
            <Empty>
                <EmptyHeader>
                    <EmptyTitle> Page not found </EmptyTitle>
                    <EmptyDescription>
                        The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    </EmptyDescription>
                </EmptyHeader>

                <EmptyContent>
                    <Button asChild>
                        <Link href="/"> Return home </Link>
                    </Button>
                </EmptyContent>
            </Empty>
        </main>
    )
}