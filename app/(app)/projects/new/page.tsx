import type { Metadata } from 'next';
import { CreateProjectForm } from './form';

export const metadata: Metadata = {
    title: "New Project"
};

export default function NewProjectPage() {
    return (
        <>
            <h1 className="text-3xl font-bold"> New project </h1>
            <CreateProjectForm />
        </>
    );
}