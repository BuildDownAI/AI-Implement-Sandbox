"use client";

import { Input } from "@/components/ui/input";
import { updatePassword } from "./actions";
import { useActionState, useState } from "react";
import { emptyFormState } from "@/lib/form-state";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { SubmitButton } from "@/components/submit-button";

export function ResetPasswordForm() {
    const [state, formAction] = useActionState(updatePassword, emptyFormState);
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const passwordsMatch = password === confirm;

    return (
        <>
        <h1 className="text-2xl font-bold text-center"> Set a New Password </h1>
        <p className="text-muted-foreground text-center">
            Choose a new password to finish resetting your account.
        </p>

        {state.error && (
            <p className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {state.error}
            </p>
        )}

        <form action={formAction}>
            <FieldGroup>
                <Field data-invalid={!!state.fieldErrors?.password}>
                    <FieldLabel htmlFor="password"> New password </FieldLabel>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {state.fieldErrors?.password && (
                        <FieldError> {state.fieldErrors.password} </FieldError>
                    )}
                </Field>

                <Field data-invalid={!passwordsMatch && confirm !== ""}>
                    <FieldLabel htmlFor="confirm-password"> Confirm password </FieldLabel>
                    <Input
                        id="confirm-password"
                        name="confirm-password"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                    />
                    {!passwordsMatch && confirm !== "" && (
                        <FieldError> Passwords don&apos;t match </FieldError>
                    )}
                </Field>

                <SubmitButton className="w-full" disabled={!passwordsMatch} pendingLabel="Updating...">
                    Update password
                </SubmitButton>
            </FieldGroup>
        </form>
        </>
    );
}