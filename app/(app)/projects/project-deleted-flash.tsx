"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function ProjectDeletedFlash() {
    useEffect(() => {
        const name = sessionStorage.getItem("flash:project-deleted");
        if (name) {
            toast.success(`Project "${name}" was deleted`);
            sessionStorage.removeItem("flash:project-deleted");
        }
    }, []);
    
    return null;
}