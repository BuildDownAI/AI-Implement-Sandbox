"use client";

import { useSearchParams } from "next/navigation";
import { Profile } from "./queries";
import { updateProfile } from "./actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";

const ALLOWED_FILE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // also update in ./actions.ts abd Storage bucket settings if changed

export function ProfileInfoForm({ profile }: { profile: Profile }) {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");
    const message = searchParams.get("message");
    const [clientError, setClientError] = useState<string | null>(null);
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

    const initial = profile.display_name?.charAt(0).toUpperCase();

    return (
        <>
        {(error || clientError) && (
            <p className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {clientError ?? error}
            </p>
        )}
        {(message && !clientError) && (
            <p className="rounded border border-foreground/20 bg-muted p-3 text-sm">
                {message}
            </p>
        )}
        <form action={updateProfile} className="flex flex-col gap-6">
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

                <Field className="flex-1">
                    <FieldLabel htmlFor="avatar">Avatar</FieldLabel>
                    <Input
                        id="avatar"
                        name="avatar"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={handleFileChange}
                    />
                    <FieldDescription> PNG, JPEG, WebP, or GIF up to 5 MB. </FieldDescription>
                </Field>
            </div>

            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="display_name"> Display name </FieldLabel>
                    <Input
                        id="display_name"
                        name="display_name"
                        maxLength={50}
                        defaultValue={profile.display_name ?? ""}
                        placeholder="What would you like to be called?"
                    />
                    <FieldDescription> Optional. Up to 50 characters. </FieldDescription>
                </Field>
            </FieldGroup>

            <div className="flex justify-end">
                <Button type="submit"> Save changes </Button>
            </div>
        </form>
        </>
    );
}