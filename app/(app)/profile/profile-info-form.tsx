"use client";

import { Profile } from "./queries";
import { updateProfile } from "./actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import React, { useActionState, useEffect, useState } from "react";
import { emptyFormState } from "@/lib/form-state";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";

const ALLOWED_FILE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // also update in ./actions.ts abd Storage bucket settings if changed

export function ProfileInfoForm({ profile }: { profile: Profile }) {
    const [state, formAction] = useActionState(updateProfile, emptyFormState);
    const [clientError, setClientError] = useState<string | null>(null);
    const avatarError = clientError ?? state.fieldErrors?.avatar;
    const initial = profile.display_name?.charAt(0).toUpperCase();

    useEffect(() => {
        if (state.message) toast.success(state.message);
    }, [state.message]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setClientError(null);
        const file = e.target.files?.[0];
        if (!file) return;

        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            setClientError("Avatar must be PNG, JPEG, WebP, or GIF");
            e.target.value = "";
            return;
        }

        if (file.size > MAX_AVATAR_BYTES) {
            setClientError("Avatar must be 5 MB or smaller");
            e.target.value = "";
            return;
        }
    }

    return (
        <>
        {state.error && (
            <p className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {state.error}
            </p>
        )}

        <form action={formAction} className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Avatar className="size-20">
                    <AvatarImage
                        src={profile.avatar_url ?? undefined}
                        alt={profile.display_name ?? "Avatar"}
                    />
                    <AvatarFallback>
                        {initial ?? <User className="size-10" aria-hidden />}
                    </AvatarFallback>
                </Avatar>

                <Field className="flex-1" data-invalid={!!avatarError}>
                    <FieldLabel htmlFor="avatar"> Avatar </FieldLabel>
                    <Input
                        id="avatar"
                        name="avatar"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={handleFileChange}
                    />
                    <FieldDescription> PNG, JPEG, WebP, or GIF up to 5 MB. </FieldDescription>
                    {avatarError && (
                        <FieldError> {avatarError} </FieldError>
                    )}
                </Field>
            </div>

            <FieldGroup>
                <Field data-invalid={!!state.fieldErrors?.display_name}>
                    <FieldLabel htmlFor="display_name"> Display name </FieldLabel>
                    <Input
                        id="display_name"
                        name="display_name"
                        maxLength={50}
                        defaultValue={profile.display_name ?? ""}
                        placeholder="What would you like to be called?"
                    />
                    <FieldDescription> Optional. Up to 50 characters. </FieldDescription>
                    {state.fieldErrors?.display_name && (
                        <FieldError> {state.fieldErrors.display_name} </FieldError>
                    )}
                </Field>
            </FieldGroup>

            <div className="flex justify-end">
                <SubmitButton pendingLabel="Saving..."> Save changes </SubmitButton>
            </div>
        </form>
        </>
    );
}