import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProject } from '../queries';
import { DeleteProjectButton } from './delete-project-button';

export const metadata: Metadata = {
    title: "Project",
};

const STATUS_BADGE_VARIANT = {
    draft: "secondary",
    active: "default",
    archived: "outline",
} as const;

export default async function ProjectDetailsPage({ params }: {
    params: Promise<{ projectId: string }>
}) {
    const { projectId } = await params;
    const project = await getProject(projectId);
    if (!project) {
        notFound();
    }

    return (
        <>
            <div className="flex items-center justify-between gap-4">
                <Link
                    href="/projects" 
                    className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                    ← Back to projects
                </Link>
                <Badge variant={STATUS_BADGE_VARIANT[project.status]}>
                    {project.status}
                </Badge>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl"> {project.name} </CardTitle>
                    {project.description && (
                        <CardDescription className="whitespace-pre-wrap">
                            {project.description}
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
                    <span>
                        Created {new Date(project.created_at).toLocaleString()}
                    </span>
                    {project.updated_at !== project.created_at && (
                        <span>
                            Last updated {new Date(project.updated_at).toLocaleString()}
                        </span>
                    )}
                </CardContent>
                <CardFooter className="flex items-center justify-end gap-2">
                    <Button asChild variant="outline">
                        <Link href={`/projects/${project.id}/edit`}> Edit </Link>
                    </Button>
                    <DeleteProjectButton projectId={project.id} projectName={project.name} />
                </CardFooter>
            </Card>
        </>
    );
}