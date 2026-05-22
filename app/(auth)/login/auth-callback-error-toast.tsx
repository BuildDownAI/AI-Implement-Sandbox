"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export function AuthCallbackErrorToast() {
    const params = useSearchParams();
    const router = useRouter();
    const error = params.get("error");

    useEffect(() => {
        if (!error) return;
        toast.error(error);

        router.replace("/login", { scroll: false }); // strips all params from URL so the toast only fires once
    }, [error, router]);

    return null;
}