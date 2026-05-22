"use client";

import { useActionState, useState } from "react";
import { createProject } from "../actions";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { emptyFormState } from "@/lib/form-state";
import { SubmitButton } from "@/components/submit-button";

type ProjectStatus = "draft" | "active" | "archived";

export function CreateProjectForm() {
    const [state, formAction] = useActionState(createProject, emptyFormState);
    const [projectStatus, setProjectStatus] = useState<ProjectStatus>("draft");

    return (
        <>
        {state.error && (
            <p className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {state.error}
            </p>
        )}
        <form action={formAction} className="flex flex-col gap-6">
            <FieldGroup>
                <Field data-invalid={!!state.fieldErrors?.name}>
                    <FieldLabel htmlFor="name"> Name </FieldLabel>
                    <Input
                        id="name"
                        name="name"
                        required
                        maxLength={100}
                        placeholder="My new project"
                    />
                    <FieldDescription> 1 to 100 characters. </FieldDescription>
                    {state.fieldErrors?.name && (
                        <FieldError> {state.fieldErrors.name} </FieldError>
                    )}
                </Field>

                <Field data-invalid={!!state.fieldErrors?.description}>
                    <FieldLabel htmlFor="description"> Description </FieldLabel>
                    <Textarea
                        id="description"
                        name="description"
                        maxLength={1000}
                        placeholder="What's this project about?"
                        rows={4}
                    />
                    <FieldDescription> Optional. Up to 1000 characters. </FieldDescription>
                    {state.fieldErrors?.description && (
                        <FieldError> {state.fieldErrors.description} </FieldError>
                    )}
                </Field>

                <Field data-invalid={!!state.fieldErrors?.status}>
                    <FieldLabel htmlFor="status"> Status </FieldLabel>
                    <Select value={projectStatus} onValueChange={(v) => setProjectStatus(v as ProjectStatus)}>
                        <SelectTrigger id="status">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="draft"> Draft </SelectItem>
                                <SelectItem value="active"> Active </SelectItem>
                                <SelectItem value="archived"> Archived </SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <input type="hidden" name="status" value={projectStatus} />
                    {state.fieldErrors?.status && (
                        <FieldError> {state.fieldErrors.status} </FieldError>
                    )}
                </Field>
            </FieldGroup>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" asChild>
                    <Link href="/projects"> Cancel </Link>
                </Button>
                <SubmitButton pendingLabel="Creating..."> Create project </SubmitButton>
            </div>
        </form>
        </>
    );
}