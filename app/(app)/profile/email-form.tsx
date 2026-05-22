"use client";

import { updateEmail } from "./actions";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useActionState, useEffect } from "react";
import { emptyFormState } from "@/lib/form-state";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";

export function EmailForm({ currentEmail }: { currentEmail: string }) {
    const [state, formAction] = useActionState(updateEmail, emptyFormState);

    useEffect(() => {
        if (state.message) toast.success(state.message);
    }, [state.message]);

    return (
        <>
        {state.error && (
            <p className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {state.error}
            </p>
        )}

        <form action={formAction} className="flex flex-col gap-6">
            <FieldGroup>
                <Field data-invalid={!!state.fieldErrors?.email}>
                    <FieldLabel htmlFor="email"> Email </FieldLabel>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={currentEmail}
                        required
                        maxLength={254}
                    />
                    <FieldDescription>
                        For security, confirmation links will be sent to both your current and new email addresses. Both must be clicked to complete the change.
                    </FieldDescription>
                    {state.fieldErrors?.email && (
                        <FieldError> {state.fieldErrors.email} </FieldError>
                    )}
                </Field>
            </FieldGroup>

            <div className="flex justify-end">
                <SubmitButton pendingLabel="Sending..."> Update email </SubmitButton>
            </div>
        </form>
        </>
    )
}