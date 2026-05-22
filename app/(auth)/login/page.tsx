import type { Metadata } from 'next';
import { LoginForm } from "./form";
import { AccountDeletedFlash } from './account-deleted-flash';
import { Suspense } from 'react';
import { AuthCallbackErrorToast } from './auth-callback-error-toast';

export const metadata: Metadata = {
    title: "Login",
};

export default function LoginPage() {
    return (
        <>
            <LoginForm />
            
            <Suspense>
                <AuthCallbackErrorToast />
            </Suspense>
            <AccountDeletedFlash />
        </>
    );
}