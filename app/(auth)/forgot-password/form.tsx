"use client";

import { Input } from "@/components/ui/input";
import { resetPassword } from "./actions";
import { useActionState, useEffect } from "react";
import { emptyFormState } from "@/lib/form-state";
import { toast } from "sonner";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { SubmitButton } from "@/components/submit-button";

export function ForgotPasswordForm() {
    const [state, formAction] = useActionState(resetPassword, emptyFormState);

    useEffect(() => {
        if (state.message) toast.success(state.message);
    }, [state.message]);

    return (
        <>
        <h1 className="text-2xl font-bold text-center"> Reset Password </h1>
        <p className="text-muted-foreground text-center">
            A link will be sent your email address to reset your password.
        </p>

        {state.error && (
            <p className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {state.error}
            </p>
        )}

        <form action={formAction}>
            <FieldGroup>
                <Field data-invalid={!!state.fieldErrors?.email}>
                    <FieldLabel htmlFor="email"> Email </FieldLabel>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                    />
                    {state.fieldErrors?.email && (
                        <FieldError> {state.fieldErrors.email} </FieldError>
                    )}
                </Field>
                
                <SubmitButton className="w-full" pendingLabel="Sending...">
                    Send
                </SubmitButton>
            </FieldGroup>
        </form>
        </>
    );
}