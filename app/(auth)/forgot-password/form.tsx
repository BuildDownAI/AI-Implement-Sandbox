"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "./actions";

export function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  return (
    <>
      <h1 className="text-2xl font-bold text-center">
        Reset Password
      </h1>
      <p className="text-muted-foreground text-center">
          A link will be sent your email address to reset your password.
      </p>

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

      <form action={resetPassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="you@example.com" required />
        </div>

        <Button type="submit" className="w-full">
          Send
        </Button>
      </form>
    </>
  );
}