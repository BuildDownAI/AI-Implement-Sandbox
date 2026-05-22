import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsLoading() {
    return (
        <>
        <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-bold">Projects</h1>
            <Skeleton className="h-10 w-32" />
        </div>

        <ul className="flex flex-col gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <li key={i}>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between gap-4">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                            <Skeleton className="h-4 w-1/2 mt-2" />
                        </CardHeader>
                    </Card>
                </li>
            ))}
        </ul>
        </>
    );
}