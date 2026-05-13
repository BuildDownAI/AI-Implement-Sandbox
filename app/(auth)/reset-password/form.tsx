"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSearchParams } from "next/navigation";
import { updatePassword } from "./actions";

export function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");

    return (
        <>
            <h1 className="text-2xl font-bold text-center">
                Set a New Password
            </h1>
            <p className="text-muted-foreground text-center">
                Choose a new password to finish resetting your account.
            </p>

            {error && (
                <p className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                </p>
            )}

            <form action={updatePassword} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input id="password" name="password" type="password" placeholder="••••••••" required />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm password</Label>
                    <Input
                        id="confirm-password"
                        name="confirm-password"
                        type="password"
                        placeholder="••••••••"
                        required
                    />
                </div>

                <Button type="submit" className="w-full">
                    Update Password
                </Button>
            </form>
        </>
    );
}