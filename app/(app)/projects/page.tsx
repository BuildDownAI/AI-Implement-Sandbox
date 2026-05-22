import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ProjectDeletedFlash } from './project-deleted-flash';

export const metadata: Metadata = {
    title: "Projects",
};

const PAGE_SIZE = 10;
const STATUS_BADGE_VARIANT = {
    draft: "secondary",
    active: "default",
    archived: "outline",
} as const;

export default async function ProjectsPage({ searchParams }: {
    searchParams: Promise<{ page?: string }>;
}) {
    const params = await searchParams;
    const page = Math.max(1, Number(params.page) || 1);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const supabase = await createClient();
    const { data: projects, count, error } = await supabase.from("projects")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

    const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;
    const hasPrevious = page > 1;
    const hasNext = page < totalPages;

    return (
        <>
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-3xl font-bold">Projects</h1>
                <Button asChild>
                    <Link href="/projects/new">New project</Link>
                </Button>
            </div>

            {error && (
                <p className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {error.message}
                </p>
            )}

            <ProjectDeletedFlash />

            {projects && projects.length === 0 ? (
                <Empty>
                    <EmptyHeader>
                        <EmptyTitle>No projects yet</EmptyTitle>
                        <EmptyDescription>
                            Create your first project to get started.
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Button asChild>
                            <Link href="/projects/new">Create your first project</Link>
                        </Button>
                    </EmptyContent>
                </Empty>
            ) : (
                <ul className="flex flex-col gap-4">
                    {projects?.map((project) => (
                        <li key={project.id}>
                            <Link href={`/projects/${project.id}`} className="block">
                                <Card className="transition-colors hover:bg-accent">
                                    <CardHeader>
                                        <div className="flex items-center justify-between gap-4">
                                            <CardTitle className="line-clamp-1">
                                                {project.name}
                                            </CardTitle>
                                            <Badge variant={STATUS_BADGE_VARIANT[project.status]}>
                                                {project.status}
                                            </Badge>
                                        </div>
                                        {project.description && (
                                            <CardDescription className="line-clamp-2">
                                                {project.description}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                </Card>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            {totalPages > 1 && (
                <nav className="flex items-center justify-between gap-4" aria-label="Pagination">
                    {hasPrevious ? (
                        <Button asChild variant="outline">
                            <Link href={`/projects?page=${page - 1}`}>Previous</Link>
                        </Button>
                    ) : (
                        <span aria-hidden />
                    )}
                    <span className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                    </span>
                    {hasNext ? (
                        <Button asChild variant="outline">
                            <Link href={`/projects?page=${page + 1}`}>Next</Link>
                        </Button>
                    ) : (
                        <span aria-hidden />
                    )}
                </nav>
            )}
        </>
    );
}