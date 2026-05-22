"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { deleteProject } from "../actions";
import { useActionState, useEffect, useRef, useState } from "react";
import { emptyFormState } from "@/lib/form-state";

export function DeleteProjectButton({ projectId, projectName} : {
    projectId: string,
    projectName: string
}) {
    const [state, formAction, isPending] = useActionState(deleteProject, emptyFormState);
    const [submitted, setSubmitted] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state.error) {
            sessionStorage.removeItem("flash:project-deleted");
        }
    }, [state.error]);

    return (
        <AlertDialog onOpenChange={(open) => {if (open) setSubmitted(false)}}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive"> Delete </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle> Delete &ldquo;{projectName}&rdquo;? </AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete this project. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {submitted && state.error && (
                    <p className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                        {state.error}
                    </p>
                )}

                <AlertDialogFooter>
                    <AlertDialogCancel> Cancel </AlertDialogCancel>
                    <AlertDialogAction
                        className={buttonVariants({ variant: "destructive" })}
                        disabled={isPending}
                        onClick={(e) => {
                            e.preventDefault();
                            setSubmitted(true);
                            sessionStorage.setItem("flash:project-deleted", projectName);
                            formRef.current?.requestSubmit();
                        }}
                    >
                        {isPending ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>

            <form ref={formRef} action={formAction} className="hidden">
                <input type="hidden" name="id" value={projectId} />
            </form>
        </AlertDialog>
    );
}