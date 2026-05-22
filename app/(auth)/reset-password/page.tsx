import type { Metadata } from 'next';
import { ResetPasswordForm } from "./form";

export const metadata: Metadata = {
    title: "Set a New Password",
};

export default function ResetPasswordPage() {
    return (
        <ResetPasswordForm />
    );
}