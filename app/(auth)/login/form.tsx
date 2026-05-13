"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, register, signInWithGithub } from "./actions";
import { useSearchParams } from "next/navigation";
import { GithubIcon } from "@/components/icons/github";

export function LoginForm() {
  const [isRegistering, setIsRegistering] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  return (
    <>
      <h1 className="text-2xl font-bold text-center">
        {isRegistering ? "Create account" : "Log in"}
      </h1>

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

      <form action={signInWithGithub}>
        <Button type="submit" variant="outline" className="w-full">
          <GithubIcon className="mr-2 size-4"/>
          Continue with GitHub
        </Button>
      </form>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t"/>
        </div>
        
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            or continue with email
          </span>
        </div>
      </div>

      <form action={isRegistering ? register : login}  className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="you@example.com" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" placeholder="••••••••" required />
        </div>

        {isRegistering && (
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
        )}

        <Button type="submit" className="w-full">
          {isRegistering ? "Register" : "Log in"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {isRegistering ? (
          <>
            Already have an account?{" "}
            <button
              type="button"
              className="underline underline-offset-4 hover:text-foreground"
              onClick={() => setIsRegistering(false)}
            >
              Log in
            </button>
          </>
        ) : (
          <>
            <a href="/forgot-password" className="underline underline-offset-4 hover:text-foreground">
              Forgot password?
            </a>
            {" | "}Don&apos;t have an account?{" "}
            <button
              type="button"
              className="underline underline-offset-4 hover:text-foreground"
              onClick={() => setIsRegistering(true)}
            >
              Register
            </button>
          </>
        )}
      </p>
    </>
  );
}