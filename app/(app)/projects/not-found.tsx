import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import Link from "next/link";


export default function ProjectNotFound() {
    return (
        <Empty>
            <EmptyHeader>
                <EmptyTitle> Project not found </EmptyTitle>
                <EmptyDescription>
                    This project doesn&apos;t exist or you don&apos;t have access to it.
                </EmptyDescription>
            </EmptyHeader>

            <EmptyContent>
                <Button asChild>
                    <Link href="/projects"> Back to projects </Link>
                </Button>
            </EmptyContent>
        </Empty>
    );
}