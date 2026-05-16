"use client";

import { useSearchParams } from "next/navigation";
import { updateEmail } from "./actions";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function EmailForm({ currentEmail }: { currentEmail: string }) {
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

        <form action={updateEmail} className="flex flex-col gap-6">
            <FieldGroup>
                <Field>
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
                </Field>
            </FieldGroup>

            <div className="flex justify-end">
                <Button type="submit"> Update email </Button>
            </div>
        </form>
        </>
    )
}