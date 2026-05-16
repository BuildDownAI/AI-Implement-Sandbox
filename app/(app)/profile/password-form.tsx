"use client";

import { useSearchParams } from "next/navigation";
import { updatePassword } from "./actions";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function PasswordForm() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");
    const message = searchParams.get("message");

    return (
        <>
        {error && (
            <p className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
            </p>
        )}
        {message && (
            <p className="rounded border border-foreground/20 bg-muted p-3 text-sm">
                {message}
            </p>
        )}
        
        <form action={updatePassword} className="flex flex-col gap-6">
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="password"> New password </FieldLabel>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        minLength={8}
                        placeholder="••••••••"
                        autoComplete="new-password"
                    />
                    <FieldDescription> At least 8 characters. </FieldDescription>
                </Field>

                <Field>
                    <FieldLabel htmlFor="confirm-password"> Confirm new password </FieldLabel>
                    <Input
                        id="confirm-password"
                        name="confirm-password"
                        type="password"
                        required
                        minLength={8}
                        placeholder="••••••••"
                        autoComplete="new-password"
                    />
                </Field>
            </FieldGroup>

            <div className="flex justify-end">
                <Button type="submit"> Update password </Button>
            </div>
        </form>
        </>
    )
}