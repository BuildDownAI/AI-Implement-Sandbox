"use client";

import { ComponentProps } from "react";
import { Button } from "./ui/button";
import { useFormStatus } from "react-dom";

export function SubmitButton({ 
    children,
    pendingLabel = "Saving...",
    disabled,
    ...rest }:
    ComponentProps<typeof Button> & { pendingLabel?: string }
) {
    const { pending } = useFormStatus();
    return (
        <Button {...rest} type="submit" disabled={pending || disabled} >
            {pending ? pendingLabel : children}
        </Button>
    );
}