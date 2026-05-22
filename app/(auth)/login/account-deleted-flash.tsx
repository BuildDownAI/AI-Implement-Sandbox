"use client"

import { useEffect } from "react"
import { toast } from "sonner"

export function AccountDeletedFlash() {
    useEffect(() => {
        if (sessionStorage.getItem("flash:account-deleted")) {
            toast.success("Your account has been deleted");
            sessionStorage.removeItem("flash:account-deleted");
        }
    }, []);
    
    return null;
}