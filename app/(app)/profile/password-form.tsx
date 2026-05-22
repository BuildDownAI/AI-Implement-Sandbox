"use client";

import { updatePassword } from "./actions";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useActionState, useEffect, useState } from "react";
import { emptyFormState } from "@/lib/form-state";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";

export function PasswordForm() {
    const [state, formAction] = useActionState(updatePassword, emptyFormState);
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const passwordsMatch = password === confirm;

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
                    <FieldDescription> At least 8 characters. </FieldDescription>
                    {state.fieldErrors?.password && (
                        <FieldError> {state.fieldErrors.password} </FieldError>
                    )}
                </Field>

                <Field data-invalid={!passwordsMatch && confirm !== ""}>
                    <FieldLabel htmlFor="confirm-password"> Confirm new password </FieldLabel>
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
            </FieldGroup>

            <div className="flex justify-end">
                <SubmitButton disabled={!passwordsMatch} pendingLabel="Updating..."> Update password </SubmitButton>
            </div>
        </form>
        </>
    )
}