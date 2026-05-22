import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "@/lib/supabase/database.types";

// Paths an UNAUTHENTICATED user is allowed to visit, everything else redirects to /login.
// `/auth/*` are route handlers (OAuth callback, email confirmation) that signed-out users hit as part of completing sign-in.
const UNAUTH_ALLOWED_ROUTE_PREFIXES = ["/login", "/forgot-password", "/auth"];

// Paths an AUTHENTICATED user is redirected from (back to home `/`)
// /reset-password is intentionally omitted: the recovery flow lands authenticated users (via recovery session) there to set a new password.
const AUTH_RESTRICTED_ROUTE_PREFIXES = ["/login", "/forgot-password"];

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request, });

    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet, headers) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({ request, });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                    Object.entries(headers).forEach(([key, value]) =>
                        supabaseResponse.headers.set(key, value)
                    )
                },
            },
        }
    );

    // Do not run code between createServerClient and
    // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.
    // IMPORTANT: If you remove getClaims() and you use server-side rendering
    // with the Supabase client, your users may be randomly logged out.
    const { data } = await supabase.auth.getClaims();
    const user = data?.claims;

    const path = request.nextUrl.pathname;
    const isHome = path === "/";
    const isUnauthAllowed = isHome || UNAUTH_ALLOWED_ROUTE_PREFIXES.some((p) => path.startsWith(p));
    const isAuthRestricted = AUTH_RESTRICTED_ROUTE_PREFIXES.some((p) => path.startsWith(p));

    // no user exists and they're not trying to access a page to authenticate
    if (!user && !isUnauthAllowed) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    if (user && isAuthRestricted) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}