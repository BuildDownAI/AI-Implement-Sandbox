import { Skeleton } from "@/components/ui/skeleton";

export default function EditProjectLoading() {
    return (
        <>
        <h1 className="text-3xl font-bold"> Edit project </h1>
        <div className="flex flex-col gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-3 w-40" />
                </div>
            ))}
            <div className="flex justify-end gap-2">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-32" />
            </div>
        </div>
        </>
    );
}