"use client";

import { useState } from "react";
import { Button } from "./ui/button";


export function ThemeToggle() {
    const [isDark, setIsDark] = useState(false); 

    function toggle() {
        const next = !isDark;
        setIsDark(next);
        document.documentElement.classList.toggle("dark", next);
    }

    return (
        <Button onClick={toggle}>
            Switch to {isDark ? 'light' : 'dark'} mode
        </Button>
    );
}