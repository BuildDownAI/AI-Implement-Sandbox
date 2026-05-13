import type { Metadata } from 'next';
import { Suspense } from "react";
import { ForgotPasswordForm } from "./form";

export const metadata: Metadata = {
  title: "Forgot Password",
};

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}