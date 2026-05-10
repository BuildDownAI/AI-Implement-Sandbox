"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function UsersPage() {
  const [isRegistering, setIsRegistering] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center">
          {isRegistering ? "Create account" : "Log in"}
        </h1>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>

          {isRegistering && (
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
              />
            </div>
          )}

          <Button type="submit" className="w-full">
            {isRegistering ? "Sign up" : "Log in"}
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {isRegistering ? (
            <>
              Already have an account?{" "}
              <button
                className="underline underline-offset-4 hover:text-foreground"
                onClick={() => setIsRegistering(false)}
              >
                Log in
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <button
                className="underline underline-offset-4 hover:text-foreground"
                onClick={() => setIsRegistering(true)}
              >
                Register
              </button>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
