import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

export const metadata: Metadata = {
    title: {
        default: 'AI-Implement Sandbox',
        template: '%s | AI-Implement Sandbox',
    },
    description: 'AI-Implement integration test scaffold',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                    {children}
                </ThemeProvider>
                <Toaster position="top-center"/>
            </body>
        </html>
    );
}
