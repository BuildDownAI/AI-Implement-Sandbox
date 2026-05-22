import type { Metadata } from 'next';
import { getProject } from '../../queries';
import { notFound } from 'next/navigation';
import { EditProjectForm } from './form';

export const metadata: Metadata = {
    title: "Edit project"
};

export default async function EditProjectPage({ params }: {
    params: Promise<{ projectId: string }>
}) {
    const { projectId } = await params;
    const project = await getProject(projectId);
    if (!project) {
        notFound();
    }

    return (
        <>
            <h1 className="text-3xl font-bold"> Edit project </h1>
            <EditProjectForm project={project}/>
        </>
    );
}