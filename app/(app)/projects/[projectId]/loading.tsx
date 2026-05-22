import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function ProjectDetailLoading() {
    return (
        <>
        <div className="flex items-center justify-between gap-4">
            <Link
                href="/projects" 
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
                ← Back to projects
            </Link>
            <Skeleton className="h-5 w-16 rounded-full" />
        </div>

        <Card>
            <CardHeader>
                <Skeleton className="h-7 w-2/3" />
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-4/5 mt-1" />
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-2/5" />
            </CardContent>
            <CardFooter className="flex items-center justify-end gap-2">
                <Skeleton className="h-10 w-16" />
                <Skeleton className="h-10 w-16" />
            </CardFooter>
        </Card>
        </>
    );
}