"use client";

import { usePathname } from "next/navigation";
import { Profile } from "@/app/(app)/profile/queries";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { logout } from "../(auth)/login/actions";
import { LogOut } from "lucide-react";
import { useRef } from "react";

type HeaderProps = {
    profile: Pick<Profile, "display_name" | "avatar_url"> | null;
    email: string | null;
};

const navLinks = [
    { href: "/projects", label: "Projects" },
    { href: "/profile", label: "Profile" },
] as const;

export function Header({ profile, email }: HeaderProps) {
    const pathname = usePathname();
    const isAuthed = profile !== null;
    const isActivePath = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
    const logoutFormRef = useRef<HTMLFormElement>(null);
    
    const initial = profile?.display_name?.trim()[0]?.toUpperCase() ??
        email?.trim()[0]?.toUpperCase() ??
        "?";

    return (
        <header className="sticky top-0 z-10 border-b bg-background">
            <div className="relative mx-auto flex h-16 max-w-7xl items-center gap-6 px-6">
                <Link href="/" className="text-lg font-semibold tracking-tight text-foreground">
                    AI-Implement Sandbox
                </Link>

                <div className="flex-1" />

                {isAuthed && (
                    <nav aria-label="Primary" className="absolute left-1/2 -translate-x-1/2">
                        <div className="inline-flex gap-0.5 rounded-full bg-secondary p-1">
                            {navLinks.map(({ href, label}) => (
                                <Link
                                    key={href}
                                    href={href}
                                    aria-current={isActivePath(href) ? "page" : undefined}
                                    className={cn(
                                        "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                                        isActivePath(href)
                                            ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                                            : "text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </nav>
                )}

                <div className="flex items-center gap-1">
                    <ThemeToggle />

                    {isAuthed ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="size-9 rounded-full p-0" aria-label="Open user menu">
                                    <Avatar className="size-9">
                                        {profile.avatar_url && (
                                            <AvatarImage src={profile.avatar_url} alt="" />
                                        )}
                                        <AvatarFallback> {initial} </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" sideOffset={6} className="w-56">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="text-sm font-medium text-foreground">
                                        {profile.display_name ?? "User"}
                                    </div>
                                    <div className="text-xs text-muted-foreground"> {email} </div>
                                </DropdownMenuLabel>

                                <DropdownMenuSeparator />

                                <DropdownMenuGroup>
                                    <DropdownMenuItem
                                        className="text-primary focus:bg-destructive/10 focus:text-destructive"
                                        onSelect={() => logoutFormRef.current?.requestSubmit()}
                                    >
                                        <LogOut className="size-4" aria-hidden="true" />
                                        Log out
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button asChild>
                            <Link href="/login"> Log in </Link>
                        </Button>
                    )}
                </div>
            </div>
            <form ref={logoutFormRef} action={logout} className="hidden" />
        </header>
    );
}