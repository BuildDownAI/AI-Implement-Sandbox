"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login, register, signInWithGithub } from "./actions";
import { GithubIcon } from "@/components/icons/github";
import { emptyFormState } from "@/lib/form-state";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import Link from "next/link";

export function LoginForm() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const passwordsMatch = !isRegistering || password === confirm;

    const [loginState, loginAction] = useActionState(login, emptyFormState);
    const [registerState, registerAction] = useActionState(register, emptyFormState);
    const [githubState, githubAction] = useActionState(signInWithGithub, emptyFormState);

    const activeState = isRegistering ? registerState : loginState;
    const formLevelError = githubState.error ?? activeState.error;

    useEffect(() => {
        if (registerState.message) toast.success(registerState.message);
    }, [registerState.message]);

    return (
        <>
        <h1 className="text-2xl font-bold text-center">
            {isRegistering ? "Create account" : "Log in"}
        </h1>

        {formLevelError && (
            <p className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {formLevelError}
            </p>
        )}

        <form action={githubAction}>
            <SubmitButton variant="outline" className="w-full" pendingLabel="Redirecting...">
                <GithubIcon className="mr-2 size-4"/>
                Continue with GitHub
            </SubmitButton>
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

        <form action={isRegistering ? registerAction : loginAction}>
            <FieldGroup>
                <Field data-invalid={!!activeState.fieldErrors?.email}>
                    <FieldLabel htmlFor="email"> Email </FieldLabel>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required 
                    />
                    {activeState.fieldErrors?.email && (
                        <FieldError> {activeState.fieldErrors.email} </FieldError>
                    )}
                </Field>

                <Field data-invalid={!!activeState.fieldErrors?.password}>
                    <FieldLabel htmlFor="password"> Password </FieldLabel>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {activeState.fieldErrors?.password && (
                        <FieldError> {activeState.fieldErrors.password} </FieldError>
                    )}
                </Field>

                {isRegistering && (
                    <Field data-invalid={!passwordsMatch && confirm !== ""} >
                        <FieldLabel htmlFor="confirm-password"> Confirm password </FieldLabel>
                        <Input
                            id="confirm-password"
                            name="confirm-password"
                            type="password"
                            placeholder="••••••••"
                            required
                            minLength={8}
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                        />
                        {!passwordsMatch && confirm !== "" && (
                            <FieldError> Passwords don&apos;t match </FieldError>
                        )}
                    </Field>
                )}

                <SubmitButton
                    className="w-full"
                    disabled={!passwordsMatch}
                    pendingLabel={isRegistering ? "Creating account..." : "Signing in..."}
                >
                    {isRegistering ? "Register" : "Log in"}
                </SubmitButton>
            </FieldGroup>
        </form>

        <p className="text-center text-sm text-muted-foreground">
            {isRegistering ? (
                <>
                    Already have an account?{" "}
                    <Button
                        variant="link"
                        type="button"
                        className="p-0 h-auto"
                        onClick={() => setIsRegistering(false)}
                    >
                        Log in
                    </Button>
                </>
            ) : (
                <>
                    <Button variant="link" asChild className="p-0 h-auto">
                        <Link href="/forgot-password"> Forgot password? </Link>
                    </Button>

                    <span aria-hidden="true" className="mx-2">|</span>

                    Don&apos;t have an account?{" "}
                    <Button
                        variant="link"
                        type="button"
                        className="p-0 h-auto"
                        onClick={() => setIsRegistering(true)}
                    >
                        Register
                    </Button>
                </>
            )}
        </p>
        </>
    );
}