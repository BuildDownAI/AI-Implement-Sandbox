# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose of this repo

This is **not a real application** — it is a scaffold whose sole purpose is to validate the [AI Implement](https://github.com/BuildDownAI/AI-Implement) end-to-end integration (Linear ↔ GitHub ↔ AI-Implement). The "feature" being verified is that an AI agent can take a Linear issue, open a PR against this repo, and have it merge cleanly. The Next.js + shadcn application exists only so there is something concrete to modify, run, and test.

When implementing changes here, prefer **minimal, conventional** edits. Adding heavy abstractions, new dependencies, or architectural reshaping is almost always out of scope — the code is intentionally small.

## Commands

- `npm install` — install dependencies (Node.js **22+** required; see [.nvmrc](.nvmrc) — run `nvm use`)
- `npm run dev` — start the Next.js dev server (port 3000; override with `PORT=8080 npm run dev`)
- `npm run build` — production build (`next build`)
- `npm start` — serve the production build (`next start -H 0.0.0.0`); run `npm run build` first
- `npm test` — run the Vitest suite (`vitest run`)
- Run a single test file: `npx vitest run test/login-form.test.tsx`
- Run in watch mode: `npx vitest`
- Filter by test name: `npx vitest run -t 'renders login mode by default'`
- `npm run lint` — run `next lint`
- `npm run db:types` — regenerate [lib/supabase/database.types.ts](lib/supabase/database.types.ts) from the linked Supabase schema. **Run after every migration — including ones that only add/modify Postgres functions or triggers, not just tables.** New RPC functions only appear in the typed client after re-generation.
- Add a new shadcn component: `npx shadcn@latest add <name>` (e.g. `button`, `card`, `dialog`) — files land in [components/ui/](components/ui/)

## Documented Solutions

`docs/solutions/` — documented solutions to past problems (bugs, best practices, workflow patterns), organized by category with YAML frontmatter (`module`, `tags`, `problem_type`). Relevant when implementing or debugging in a documented area.

## Architecture

The App Router carries the entire app, organized into two route groups by access level:

- **`app/(auth)/`** — public routes for unauthenticated users (`/login`, `/forgot-password`, `/reset-password`). Shares a centered card-style layout at [app/(auth)/layout.tsx](app/(auth)/layout.tsx).
- **`app/(app)/`** — the main app shell (`/`, `/projects/*`, `/profile`). The layout at [app/(app)/layout.tsx](app/(app)/layout.tsx) wraps every page with a top nav `<Header />` ([app/(app)/header.tsx](app/(app)/header.tsx)) + a `<main className="mx-auto max-w-3xl ...">` container, so individual pages emit raw content without their own `<main>` element. Note: the (app) group includes the home page `/`, which renders public content for signed-out visitors via the middleware allowlist.
- **`app/auth/`** — *not* a route group (no parens); contains route handlers for the auth flow: [app/auth/confirm/route.ts](app/auth/confirm/route.ts) (email/recovery OTP) and [app/auth/callback/route.ts](app/auth/callback/route.ts) (OAuth code exchange).

Route groups (parenthesized folder names) do **not** affect URLs — `(auth)/login/page.tsx` is served at `/login`, not `/(auth)/login`. They exist purely to organize pages that share a layout or convention.

The **root layout** at [app/layout.tsx](app/layout.tsx) hosts globally-mounted singletons: the [next-themes](https://github.com/pacocoursey/next-themes) `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>` (which manages the `dark` class on `<html>` with localStorage persistence + system preference detection) and a single `<Toaster />` from [sonner](https://sonner.emilkowal.ski) (one Toaster per app — mounting multiple causes navigation-time toast drops, since each Toaster instance subscribes to sonner's global state separately).

### Page convention: Server Component page + Client Component form

Pages that need browser interactivity (`useState`, event handlers, hooks) follow a three-file split:

- **`page.tsx`** — Server Component. Exports `metadata` for the page title.
- **`form.tsx`** — Client Component (`"use client"`). Holds the actual UI, state (`useState`, `useActionState`), and event wiring.
- **`actions.ts`** — Server Actions (`"use server"` at the top). Invoked from the form via the `action={...}` prop on a `<form>`.
- **`schema.ts`** — zod schemas for input validation. Imports may include the shared field primitives from [lib/schemas/auth-fields.ts](lib/schemas/auth-fields.ts).

A `<Suspense>` boundary is only required when a client component uses `useSearchParams` (see [Next docs on the Suspense bail-out](https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout)). Most forms across the app no longer read search params (state flows through `useActionState`), so most pages don't need Suspense — exception is [app/(auth)/login/page.tsx](app/(auth)/login/page.tsx) which wraps `<AuthCallbackErrorToast />` in Suspense.

### Auth: three Supabase clients

Auth uses `@supabase/ssr`'s cookie-based session model. Three client factories under [lib/supabase/](lib/supabase/) — pick by execution context:

- [lib/supabase/client.ts](lib/supabase/client.ts) — `createBrowserClient`. Use in Client Components that need browser-side auth (rare; most reads happen server-side).
- [lib/supabase/server.ts](lib/supabase/server.ts) — `createServerClient` reading from `cookies()`. Use in Server Components, Server Actions, and Route Handlers.
- [lib/supabase/proxy.ts](lib/supabase/proxy.ts) — `createServerClient` reading/writing the NextRequest/NextResponse cookies in middleware. Refreshes the session on every request and gates routes via `supabase.auth.getClaims()`.

The middleware entry point is [middleware.ts](middleware.ts) at the repo root. Two prefix-arrays in [lib/supabase/proxy.ts](lib/supabase/proxy.ts) gate routing in both directions:

- **`UNAUTH_ALLOWED_ROUTE_PREFIXES`** — `["/login", "/forgot-password", "/auth"]` (plus exact-match `/` for the public home). Anything else → redirect to `/login` if no session.
- **`AUTH_RESTRICTED_ROUTE_PREFIXES`** — `["/login", "/forgot-password"]`. Authenticated users hitting these → redirect to `/`. `/reset-password` is intentionally **not** restricted because the recovery flow creates an authenticated session before landing the user there.

**Always use `supabase.auth.getClaims()` on the server.** Never `getSession()` — its cookie storage is not cryptographically verified server-side. `getClaims()` verifies the JWT locally via cached JWKS and is documented as the preferred method.

### Auth flows that exist today

| Flow                | Pages                                    | Server Actions                            | Route handler          |
|---------------------|-------------------------------------------|--------------------------------------------|------------------------|
| Email/password login | `/login`                                  | `login` ([app/(auth)/login/actions.ts](app/(auth)/login/actions.ts)) | — |
| Email/password signup | `/login` (toggle)                         | `register`                                  | `/auth/confirm` (verifyOtp) |
| GitHub OAuth        | `/login`                                  | `signInWithGithub`                          | `/auth/callback` (exchangeCodeForSession) |
| Password reset request | `/forgot-password`                       | `resetPassword` ([app/(auth)/forgot-password/actions.ts](app/(auth)/forgot-password/actions.ts)) | `/auth/confirm` (verifyOtp, type=recovery) |
| Password reset complete | `/reset-password`                      | `updatePassword` ([app/(auth)/reset-password/actions.ts](app/(auth)/reset-password/actions.ts)) | — |
| **Change email** (logged in) | `/profile`                          | `updateEmail` ([app/(app)/profile/actions.ts](app/(app)/profile/actions.ts)) | `/auth/confirm` (verifyOtp, type=email_change) — **double confirmation: both current and new addresses must click** |
| **Change password** (logged in) | `/profile`                       | `updatePassword` ([app/(app)/profile/actions.ts](app/(app)/profile/actions.ts)) | — (immediate, no email round-trip) |
| **Delete account** | `/profile`                                | `deleteAccount` ([app/(app)/profile/actions.ts](app/(app)/profile/actions.ts)) — calls `supabase.rpc("delete_current_user")` then `signOut()` | — |
| Logout              | (Server Action button, any page)         | `logout`                                    | — |

Email templates in the Supabase dashboard must use the PKCE format with **`{{ .RedirectTo }}`** rather than `{{ .SiteURL }}` so the URL is dynamic per-environment (`http://localhost:3000/auth/confirm?...` in local dev, the production URL in deploys, the preview URL in PR previews). Template: `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=<type>&next=<path>`. The action passes `emailRedirectTo: ${SITE_URL}/auth/confirm` (the full path including the handler segment); `{{ .RedirectTo }}` substitutes that value directly, so the template only needs to append the PKCE query string — re-adding `/auth/confirm` would double-up the segment and 404. The default `{{ .ConfirmationURL }}` template doesn't pass `token_hash` and the handler will fail. This is the only remaining dashboard-only setup step after `supabase db push` lands all migrations cleanly — the trial provisioning script will automate it via the Supabase Management API (`PATCH /v1/projects/{ref}/config/auth`).

### Domain entity: `projects`

The primary domain entity, intentionally minimal:

- **Schema**: [supabase/migrations/](supabase/migrations/) — versioned, numeric-prefixed SQL files applied to the live Supabase project via the dashboard SQL editor. The `projects` table has `name`, `description`, `status` (enum: `draft|active|archived`), `user_id` FK, and timestamps.
- **Row-Level Security**: Postgres-side per-user isolation. Every query is auto-filtered by `auth.uid() = user_id`. **App code never needs `.eq("user_id", ...)`** — RLS does it. INSERTs must include `user_id` in the payload so the `WITH CHECK` policy can verify it.
- **Types**: [lib/supabase/database.types.ts](lib/supabase/database.types.ts) is generated by `npm run db:types` (which runs `supabase gen types typescript --linked`). The `Database` generic is threaded into all three Supabase client factories. **Re-run after every migration.**
- **Reads**: [app/(app)/projects/queries.ts](app/(app)/projects/queries.ts) exports `getProject(id)` (cached per-request via React's `cache()`) and the `Project` row type. List queries live inline in the list page since they take dynamic pagination params.
- **Mutations**: [app/(app)/projects/actions.ts](app/(app)/projects/actions.ts) exports `createProject`, `updateProject`, `deleteProject` Server Actions, validated by the zod schema in [app/(app)/projects/schema.ts](app/(app)/projects/schema.ts).
- **Auto-seed on signup**: [supabase/migrations/00009_sample_projects_trigger.sql](supabase/migrations/00009_sample_projects_trigger.sql) — a `SECURITY DEFINER` trigger on `auth.users` INSERTs two sample projects (one `active` + one `draft`) for every new user. Mirrors the `handle_new_user()` profile-creation pattern. Fires only on new signups — backfill existing dev users by hand if you want sample data retroactively.

#### Projects routes

| Route                              | File pattern                                                       |
|------------------------------------|--------------------------------------------------------------------|
| `/projects`                         | [app/(app)/projects/page.tsx](app/(app)/projects/page.tsx) (Server) — list view, `?page=N` pagination, 10/page |
| `/projects/new`                     | `new/page.tsx` + `new/form.tsx` — create flow (Server page + Client form) |
| `/projects/[projectId]`             | `[projectId]/page.tsx` — detail view; delete confirmation in `delete-project-button.tsx` (Client, AlertDialog) |
| `/projects/[projectId]/edit`        | `[projectId]/edit/page.tsx` + `edit/form.tsx` — edit flow         |

#### Form composition pattern (all forms across the app)

- **Native HTML `<form action={...}>`** wired to a Server Action via React 19's `useActionState`:
  ```tsx
  const [state, formAction, isPending] = useActionState(serverAction, emptyFormState);
  // <form action={formAction}>...</form>
  ```
  Actions are typed as `(prevState: FormState, formData: FormData) => Promise<FormState>` and return the state shape defined in [lib/form-state.ts](lib/form-state.ts). The third tuple element (`isPending`) drives pending-state UI on submit buttons or destructive AlertDialog actions.
- **`FormState` shape** — `{ error?: string; fieldErrors?: Record<string, string>; message?: string }`. `error` is a form-level destructive banner; `fieldErrors` are per-input messages (rendered under each Field via `<FieldError>`); `message` is a success that fires a toast via `useEffect(() => { if (state.message) toast.success(state.message) }, [state.message])`.
- **`toFieldErrors(zodError)`** in [lib/form-state.ts](lib/form-state.ts) wraps zod 4's `z.flattenError(error)` to produce the `Record<string, string>` shape — one message per field (first of zod's array). Action validation pattern: `const parsed = schema.safeParse(input); if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };`
- **Parsing FormData**: `safeParse(Object.fromEntries(formData))` for multi-field forms (use destructuring like `const { avatar, ...rest } = Object.fromEntries(formData)` to peel off file inputs); `safeParse({ field: formData.get("field") })` for single-field actions. Never `formData.get("x") as string` — the cast is a type lie that hides `null` and `File` cases.
- **FieldGroup / Field / FieldLabel / FieldDescription / FieldError** from [components/ui/field.tsx](components/ui/field.tsx) for layout. Each `<Field data-invalid={!!state.fieldErrors?.x}>` opts into destructive styling when its named field has an error. `<FieldError>` renders with `role="alert"` — assertion-friendly for tests.
- **`Input` / `Textarea`** are uncontrolled (`defaultValue` for edit, no `value` for create) **unless** the form needs to read their value client-side (e.g., confirm-password match in [reset-password/form.tsx](app/(auth)/reset-password/form.tsx) and [login/form.tsx](app/(auth)/login/form.tsx)). Controlled inputs use `value` + `onChange={(e) => setX(e.target.value)}`. Mix freely within one form.
- **`Select`** is forced controlled by Radix — pair with a `<input type="hidden" name="x">` mirror so the value reaches FormData.
- **Hidden `<input type="hidden" name="id">`** on edit / delete forms carries the row id to the action.
- **File inputs** (`<input type="file" name="..." accept="...">`) submit as `File` objects in FormData. The action destructures them out of the FormData object (`Object.fromEntries(formData)` returns `File` for file inputs) and validates separately: guard on `file.size > 0` (empty file inputs still submit a zero-byte File), validate MIME + size into `fieldErrors.<inputName>`, then upload via `supabase.storage.from(bucket).upload(...)`. Client-side `onChange` validation is for UX only — the action and the bucket's MIME allowlist are the security boundary.
- **zod validates server-side** in the action; `required` + `maxLength` on inputs provide browser-level first-line defense.
- **`<SubmitButton>`** from [components/submit-button.tsx](components/submit-button.tsx) reads `useFormStatus().pending` (from `react-dom`) and disables itself + swaps to `pendingLabel` while the action is in flight. Drop-in replacement for `<Button type="submit">` in forms.
- **Destructive confirmations use AlertDialog** — two valid patterns depending on where state lives:
  - **Plain `<Button type="submit">` inside the form, no `AlertDialogAction`** ([delete-project-button.tsx](app/(app)/projects/[projectId]/delete-project-button.tsx) — historical pattern from Block 2). Works when the action redirects on success; the modal closing with the page change is fine. Lost if the action needs to return state (e.g., for an inline error).
  - **`AlertDialogAction` + form-ref + `requestSubmit()`** ([delete-account-button.tsx](app/(app)/profile/(forms)/delete-account-button.tsx)). The form lives at the AlertDialog root (outside `AlertDialogContent` so it survives the dialog close). Click handler does `e.preventDefault()` (keeps dialog open while the action flies), then `formRef.current?.requestSubmit()`. Pair with `useActionState`'s `isPending` for the disabled/pending label on `AlertDialogAction`. Use `buttonVariants({ variant: "destructive" })` for the destructive look.
- **Sectioned settings pages** (e.g. `/profile`): one Server Component page renders multiple independent `<form>` Card sections, each with its own `useActionState` slot. Errors and toasts are per-section — no bleed-through, because each form holds its own state instance. Conditional sections wrap multiple Cards in a `<>...</>` fragment — the fragment is DOM-invisible, so cards remain direct flex children of `<main>` and inherit the layout's `gap-6` spacing.
- **Cross-page feedback** (action redirects to a different page on success/failure) uses **sessionStorage flash** — the originating component writes a one-time key before the action submits (e.g., `sessionStorage.setItem("flash:project-deleted", projectName)`), and a small client component on the destination page reads it via `useEffect` on mount, fires a toast, and removes the key. See [project-deleted-flash.tsx](app/(app)/projects/project-deleted-flash.tsx) and [account-deleted-flash.tsx](app/(auth)/login/account-deleted-flash.tsx) for the pattern. Errors from server-side redirects ([auth/callback](app/auth/callback/route.ts), [auth/confirm](app/auth/confirm/route.ts)) propagate via `?error=` search params; [auth-callback-error-toast.tsx](app/(auth)/login/auth-callback-error-toast.tsx) on `/login` reads the param, toasts, and `router.replace`s the URL to clean it up. `useSearchParams` requires a `<Suspense>` wrapper in any page that uses it.

### Domain entity: `profiles`

The user account entity, in a 1:1 relationship with `auth.users`:

- **Schema**: [supabase/migrations/00003_profiles_table.sql](supabase/migrations/00003_profiles_table.sql) — `user_id` is both PK and FK to `auth.users(id) on delete cascade`. Columns: `display_name` (≤50 char), `avatar_path` (≤500 char, references file in Supabase Storage), timestamps.
- **Auto-creation**: [supabase/migrations/00005_profiles_trigger.sql](supabase/migrations/00005_profiles_trigger.sql) — a `SECURITY DEFINER` Postgres function `handle_new_user()` fires after every INSERT on `auth.users`. Creates the matching profile row for both email/password *and* OAuth signups, with no app code involved. Backfilled existing users via direct INSERT in the SQL editor.
- **RLS**: [supabase/migrations/00004_profiles_rls.sql](supabase/migrations/00004_profiles_rls.sql) — SELECT + UPDATE only (INSERT handled by trigger; DELETE handled by cascade). Both policies filter to `auth.uid() = user_id`.
- **Storage**: an `avatars` bucket with public reads + per-user-folder writes. Path convention `<user_id>/<filename>`. Per-row Storage policies scope writes via `(storage.foldername(name))[1] = auth.uid()::text`. Bucket-level MIME allowlist (PNG/JPEG/WebP/GIF) + 5 MB cap. All expressed in [supabase/migrations/00007_avatars_bucket.sql](supabase/migrations/00007_avatars_bucket.sql) (bucket + settings) and [supabase/migrations/00008_avatars_rls.sql](supabase/migrations/00008_avatars_rls.sql) (the four per-row policies). Applied automatically by `supabase db push` against a fresh project — no dashboard setup required.
- **Self-delete**: [supabase/migrations/00006_delete_user_function.sql](supabase/migrations/00006_delete_user_function.sql) — a `SECURITY DEFINER` RPC `delete_current_user()` lets a user delete *themselves* from `auth.users` without exposing a service-role key. Cascading FKs clean up `profiles` and `projects` automatically. Called via `supabase.rpc("delete_current_user")` from the `deleteAccount` action; **note that adding/changing Postgres functions requires re-running `npm run db:types`** so the RPC name appears in the typed client.

  **Pattern for any future self-acting `SECURITY DEFINER` function**: use `auth.uid()` directly inside the function rather than accepting a `user_id` parameter the caller could supply. Reasons: (1) `auth.uid()` is JWT-bound and unspoofable — app code can't make it return anything other than the calling user's UUID; (2) less code, smaller bug surface (a parameter version risks an inverted-conditional bug like `if (target = auth.uid())` that would allow the opposite of intended behavior); (3) self-documenting at call sites (`supabase.rpc("delete_current_user")` unambiguously means "delete me"). The parameter-with-internal-check pattern is correct *only* for admin functions acting on a *different* user — not for self-actions.
- **Reads**: [app/(app)/profile/queries.ts](app/(app)/profile/queries.ts) — `getProfile()` returns `Profile | null` for the current user (RLS handles ownership; no `user_id` filter needed in app code). The `Profile` type extends the DB row with a computed `avatar_url` field built via `supabase.storage.from("avatars").getPublicUrl(...)`.
- **Mutations**: [app/(app)/profile/actions.ts](app/(app)/profile/actions.ts) — `updateProfile` (display name + avatar), `updateEmail` (queues a two-step email-verification flow), `updatePassword` (immediate), `deleteAccount` (RPC + signOut). zod schemas in [app/(app)/profile/schema.ts](app/(app)/profile/schema.ts).

#### Profile page

- `/profile` — Server Component at [app/(app)/profile/page.tsx](app/(app)/profile/page.tsx). Reads `provider` from JWT claims (`app_metadata.provider`) and conditionally renders sections:
  - **All users**: Profile info card (display name + avatar), Danger zone card (delete account)
  - **Email-provider users only**: Email card (change email), Password card (change password)
  - **OAuth users**: Sign-in method card (informational; tells user to manage email/password through their OAuth provider)

Conditional sections wrap multiple Cards in a `<>...</>` fragment when needed — the fragment produces no DOM output, so cards remain direct flex children of the `<main>` and inherit its `gap-6` spacing.

#### Server-side avatar uploads

Avatar uploads happen inside `updateProfile` Server Action — the form's `<input type="file" name="avatar" />` produces a `File` object in `FormData` which the action reads and pipes into `supabase.storage.from("avatars").upload(...)`. Flow is **browser → Next.js server → Supabase Storage**, not browser-direct. This requires Next's `experimental.serverActions.bodySizeLimit` in [next.config.mjs](next.config.mjs) bumped above the default 1 MB (currently `'8mb'`) to allow ~5 MB file uploads plus form overhead.

Validation runs in three places (defense in depth): client-side `onChange` (UX feedback before submit), action-side zod + manual MIME/size checks (security boundary), Supabase Storage bucket MIME allowlist + size limit (final fallback).

### Layout, theming, and core files

- [app/layout.tsx](app/layout.tsx) — root HTML shell. Exports the global `metadata.title` template (`%s | AI-Implement Sandbox`). Hosts the `<ThemeProvider>` (next-themes) and the single `<Toaster />` (sonner) — both are globally-mounted singletons.
- [app/(app)/layout.tsx](app/(app)/layout.tsx) — the authenticated-shell layout: top `<Header />`, then `<main className="mx-auto max-w-3xl ...">{children}</main>`. Fetches `getProfile()` + `getClaims()` server-side to pass into the header.
- [app/(app)/header.tsx](app/(app)/header.tsx) — Client Component nav bar: brand link, Projects/Profile inline nav with `aria-current="page"` on the active route (detected via `usePathname()`), theme toggle, user dropdown (avatar + email + Log out). The Log out item submits via `<form action={logout}>` invoked from a hidden form-ref + `requestSubmit()` on the menu item's `onSelect` (Radix DropdownMenu pattern).
- [app/globals.css](app/globals.css) — Tailwind directives plus shadcn theme variables (HSL CSS custom properties; `.dark` block is the dark-mode palette). Dark-mode `--destructive` is tuned brighter than shadcn's default so error text stays readable on dark backgrounds.
- [components/ui/](components/ui/) — shadcn components copied into the repo as source files. Edit in place; add new ones with `npx shadcn@latest add <component>`. Configuration lives in [components.json](components.json).
- [components/icons/github.tsx](components/icons/github.tsx) — inline SVG used in place of `lucide-react`'s deprecated `Github` icon (lucide is removing brand icons; see lucide-icons/lucide#2792).
- [components/theme-toggle.tsx](components/theme-toggle.tsx) — Client Component using `useTheme()` from next-themes. Shows a Sun icon when dark mode is active (suggesting "switch to light") and a Moon icon when light mode is active. Uses a `mounted` gate on first render to avoid SSR hydration mismatch — the server doesn't know which theme the client will resolve to.
- [components/submit-button.tsx](components/submit-button.tsx) — `<SubmitButton>` reads `useFormStatus()` to disable the underlying `<Button>` + swap to `pendingLabel` while the enclosing form's action is in flight. **`useFormStatus` is from `react-dom`, not `react`** — easy mistake; `useActionState` is in `react`.
- [lib/form-state.ts](lib/form-state.ts) — `FormState` type (`{ error?, fieldErrors?, message? }`) + `emptyFormState` + `toFieldErrors(zodError)` helper that consumes `z.flattenError`'s output. Single transport contract between Server Actions and the forms that bind them.
- [lib/schemas/auth-fields.ts](lib/schemas/auth-fields.ts) — shared zod field-level primitives: `emailField`, `passwordField`. Auth + profile schemas compose these so the validation rules (email format, password min-length, error messages) live in one place.
- [lib/utils.ts](lib/utils.ts) — the `cn()` helper (`clsx` + `tailwind-merge`) used by every shadcn component to merge Tailwind classes safely.

### UX infrastructure

- **Toasts** — sonner. Single `<Toaster position="top-center" />` in [app/layout.tsx](app/layout.tsx). Any client component imports `toast` from `sonner` and calls `toast.success(msg)` / `toast.error(msg)`. Communicates via a module-level event bus — works across route group boundaries.
- **Loading states** — Next's `loading.tsx` file convention. Drop a `loading.tsx` next to a `page.tsx` and Next automatically wraps the segment in `<Suspense fallback={<LoadingComponent />}>`. Present at: [app/(app)/projects/loading.tsx](app/(app)/projects/loading.tsx), [app/(app)/projects/[projectId]/loading.tsx](app/(app)/projects/[projectId]/loading.tsx), [app/(app)/projects/[projectId]/edit/loading.tsx](app/(app)/projects/[projectId]/edit/loading.tsx), [app/(app)/profile/loading.tsx](app/(app)/profile/loading.tsx). Pattern: keep the static shell (real headings, real navigation links), `<Skeleton>`-replace the data-driven parts; vary widths within text blocks (`w-3/4`, `w-1/2`, `w-2/3`) for natural-looking placeholders.
- **Error boundaries** — Next's `error.tsx` file convention. Must be `"use client"`. Receives `{ error: Error & { digest?: string }; reset: () => void }`. Present at: [app/(app)/error.tsx](app/(app)/error.tsx), [app/(auth)/error.tsx](app/(auth)/error.tsx). Catches render exceptions in the segment's page/children — does NOT catch errors in the layout itself, in `notFound()` calls (which go to `not-found.tsx`), or above the route group.
- **`notFound()` boundaries** — Next's `not-found.tsx` convention. Renders when a Server Component throws `notFound()` from `next/navigation`. Two boundaries in the tree:
  - [app/(app)/projects/not-found.tsx](app/(app)/projects/not-found.tsx) — scoped to the projects subtree, catches `notFound()` from detail/edit pages with a "Project not found" message + back link.
  - [app/not-found.tsx](app/not-found.tsx) — global fallback for unmatched URLs.
- **Dark mode** — next-themes manages a `dark` class on `<html>` based on system preference + user toggle, persisted in localStorage. `suppressHydrationWarning` on `<html>` is required (next-themes sets the class client-side before React hydrates, which would otherwise warn about a server/client class mismatch).

### Tests

Vitest + React Testing Library, configured in [vitest.config.ts](vitest.config.ts) (jsdom environment, `@/*` path alias). Setup file [test/setup.ts](test/setup.ts) registers `@testing-library/jest-dom` matchers.

- **Client form tests** (e.g. [test/login-form.test.tsx](test/login-form.test.tsx), [test/projects-create-form.test.tsx](test/projects-create-form.test.tsx), [test/profile-info-form.test.tsx](test/profile-info-form.test.tsx)) mock React 19's `useActionState` (from `react`) and `useFormStatus` (from `react-dom`) via `vi.hoisted` holders so per-test state and pending values can be set, mock `sonner` to spy on `toast.success`/`toast.error`, and stub the Server Actions module so submission is a no-op. Canonical setup shape:
  ```ts
  const actionStateHolder = vi.hoisted(() => ({ state: {} as FormState, pending: false }));
  const formStatusHolder = vi.hoisted(() => ({ pending: false }));
  const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
  vi.mock("react", async () => ({
    ...await vi.importActual<typeof import("react")>("react"),
    useActionState: () => [actionStateHolder.state, vi.fn(), actionStateHolder.pending],
  }));
  vi.mock("react-dom", async () => ({
    ...await vi.importActual<typeof import("react-dom")>("react-dom"),
    useFormStatus: () => ({ pending: formStatusHolder.pending }),
  }));
  vi.mock("sonner", () => ({ toast: toastMock }));
  ```
  Reset holders + clear mocks in `beforeEach`. For components with multiple `useActionState` slots (the login form has three — login/register/github), differentiate the mock by action reference: `useActionState: (action) => action === actionMocks.login ? [loginState, ...] : ...`.
- **Server Component tests** (e.g. [test/page.test.tsx](test/page.test.tsx), [test/projects-list.test.tsx](test/projects-list.test.tsx), [test/profile-page.test.tsx](test/profile-page.test.tsx)) mock the Supabase server client chain. Async Server Components are invoked directly: `render(await Page({ searchParams: Promise.resolve({...}) }))`. For pages that compose mocked query helpers (e.g. `getProfile`) directly, mock the helper module rather than building out the full Supabase chain.
- The Supabase chain mock typically only needs to mock the *terminal* method (`.range`, `.maybeSingle`, `.single`). Intermediate `.from().select().order()` calls just return `this`-shaped objects pointing at the terminal mock.
- shadcn's `Empty` component renders its title as a styled `<div>`, not an `<h*>`. Assert via `getByText`, not `getByRole("heading")`. Same is true of `CardTitle`, `AlertDialogTitle`, and `DialogTitle` — they're not semantic `<h*>` elements.
- **`FieldError` renders with `role="alert"`** — query per-field errors via `screen.getByRole("alert")`. Multi-field error states produce multiple alerts; use `getAllByRole("alert")` + index, or scope with `within(field)`. Form-level destructive banners are plain `<p>` elements (no `role="alert"`), so `queryByRole("alert")` is `null` in that state — useful for asserting "field error vs form-level error."
- **Dialog tests** (Radix-based components like `AlertDialog`): use the dialog's accessible name via `getByRole("alertdialog", { name: /.../ })` to verify it opened with the right title. **Avoid straight-quote regexes when the title contains curly quotes** (`&ldquo;`/`&rdquo;`) — the DOM contains U+201C/U+201D, not `"`. Use a loose regex like `/delete.*my project/i`. For buttons inside vs outside the dialog with shared text, scope queries with `within(dialog).getByRole(...)`.
- **Radix `DropdownMenu` doesn't open via `fireEvent.click` in jsdom** because its mouse branch checks `event.pointerType === "mouse"`, which jsdom doesn't populate. Use **keyboard activation** instead: `trigger.focus(); fireEvent.keyDown(trigger, { key: "Enter" })`. Then query menu items via `screen.getByRole("menuitem", ...)` — Radix portals the menu into `document.body`, so `within(container)` won't find them.
- **`sessionStorage` is provided natively by jsdom** — no mocking needed, just `sessionStorage.clear()` in `beforeEach` to prevent leak across tests. The same pattern as `localStorage`.
- **File API mocking**: construct real `File` objects via `new File([content], "name", { type })` and fire via `fireEvent.change(input, { target: { files: [file] } })`. The string body `"x".repeat(N)` controls `.size` for testing size-validation client-side.
- **Spying on `requestSubmit`** for ref+requestSubmit patterns (e.g. delete-account-button, delete-project-button): `vi.spyOn(HTMLFormElement.prototype, "requestSubmit").mockImplementation(() => {})` intercepts the form submission so the test can assert it was called without actually running the action.
- **Anchored regex for `getByLabelText`**: substring matches like `/new password/i` match *every* label containing those words ("New password" *and* "Confirm new password"). RTL throws on multiple matches. Anchor with `^...$` (e.g. `/^new password$/i`) or use `{ exact: true }`.

Pattern for new pages: tests live in [test/](test/) (flat — not nested next to the source). Don't bother trying to unit-test middleware, Route Handlers, or Server Actions directly without an integration-test setup; cover them via the manual verification steps in each block's plan.

### Deployment (Fly.io)

- [fly.toml](fly.toml) — Fly app config. No `[env]` block — build-time `NEXT_PUBLIC_*` values flow via `--build-arg` from the deploy workflows, and runtime values are per-app Fly secrets.
- [Dockerfile](Dockerfile) + [docker-entrypoint.js](docker-entrypoint.js) — built by `@flydotio/dockerfile`. Default mode does a single `next build` at image-build time. Dockerfile declares `ARG NEXT_PUBLIC_SUPABASE_URL` + `ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` then re-exports them as `ENV` so `next build` inlines them into the client + server bundles. The compile/generate split (for runtime-env-var apps) is preserved as commented placeholders in all three files.
- Build-time env vars (`NEXT_PUBLIC_SUPABASE_*`) come from GitHub repo variables and are passed as `--build-arg` flags by both [fly-deploy.yml](.github/workflows/fly-deploy.yml) and [fly-preview.yml](.github/workflows/fly-preview.yml). Runtime env var `SITE_URL` is a per-app Fly secret (production set once via `flyctl secrets set --app <name> SITE_URL=...`; preview apps get it set automatically by the preview workflow).

Two GitHub Actions workflows orchestrate deploys:

- [.github/workflows/fly-deploy.yml](.github/workflows/fly-deploy.yml) — production deploy on push to `main`. Uses `FLY_API_TOKEN` (deploy-scoped to the production app).
- [.github/workflows/fly-preview.yml](.github/workflows/fly-preview.yml) — per-PR preview deploys. Creates `orchestrator-hello-world-test-pr-<N>` on PR open, deploys on each push, destroys on PR close. Uses `FLY_API_TOKEN_PREVIEW` (org-scoped, can create apps) and `vars.FLY_ORG` (the Fly organization slug).

When adding a route: create `app/<group>/<route>/page.tsx`. For an HTTP API endpoint, create `app/api/<route>/route.ts` and export named `GET`/`POST`/etc. functions.

## Key conventions

- **TypeScript everywhere** — `.tsx` for components, `.ts` for non-JSX modules. shadcn assumes TS.
- **Path alias `@/*`** maps to the repo root (configured in both [tsconfig.json](tsconfig.json) and [vitest.config.ts](vitest.config.ts)). Prefer `@/components/ui/button` over relative paths.
- **Styling is Tailwind-only** — no CSS modules, no `style={...}` unless dynamic. Compose utility classes; reach for `cn()` when conditionally combining them.
- **Server Components by default; `"use client"` only at the leaves** that need interactivity. Pages stay Server Components so they can export `metadata`.
- **Mutations go through Server Actions** bound via `useActionState`. Actions return `FormState` from [lib/form-state.ts](lib/form-state.ts); the form binds with `const [state, formAction, isPending] = useActionState(action, emptyFormState)` and renders `state.error` / `state.fieldErrors[*]` / fires `toast.success(state.message)` as appropriate.
- **`redirect()` from a Server Action still works inside `useActionState`** — it throws a `NEXT_REDIRECT` exception that propagates past the action's return value. Server Actions also implicitly refresh the current route after they complete; if a destination page expects state from the action (e.g., to render a toast), the originating component is likely unmounted before its `useEffect` can fire. Use the **sessionStorage flash pattern** for cross-page feedback instead of `router.push()` from `useEffect`.
- **`useSearchParams` requires a `<Suspense>` boundary** in any page that uses it, or `next build` will fail. Most forms no longer use it (state flows through `useActionState`).
- **For "resource not found" on a dynamic route** (e.g. project doesn't exist), call `notFound()` from `next/navigation` rather than `redirect("/list?error=...")`. Renders the nearest `not-found.tsx` boundary; preserves the URL for refresh/back; doesn't pollute the destination page with error state.
- **PostgREST refuses UPDATE/DELETE without a filter, even when RLS would scope to a single row.** Calls like `.from("profiles").update(updates)` (no filter) error at runtime with `UPDATE requires a WHERE clause`. Always end UPDATE/DELETE chains with `.eq("user_id", userId)` (or another filter); this is for PostgREST's safety net, not for RLS — RLS still does the per-user scoping at the row level. **SELECT has no such requirement** — `.from("table").select()` works without filters because RLS handles it.
- **No new dependencies without a clear reason** — the scaffold is deliberately small. Block 4 added `sonner`, `next-themes`, and `@radix-ui/react-dropdown-menu` (the last via shadcn install) — each earning its keep.

## Required environment variables

Local development (`.env.local`, not committed — `.env.local.example` ships as the canonical reference):
```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<sb_publishable_...>
SITE_URL=http://localhost:3000

# Optional. Set to "false" to hide the GitHub OAuth button on /login. Defaults to enabled.
# NEXT_PUBLIC_GITHUB_OAUTH_ENABLED=true
```

**OAuth toggle**: `NEXT_PUBLIC_GITHUB_OAUTH_ENABLED=false` hides the GitHub button on /login *and* causes `signInWithGithub` to reject with `{ error: "GitHub OAuth is disabled" }` (defense-in-depth: the UI gate is UX, the action gate is the security boundary). The check normalizes via `?.trim().toLowerCase()` so `FALSE`, ` false `, `False`, etc. all count as disabled. Unset or anything other than the literal `"false"` = enabled.

Production + per-PR previews source `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from GitHub **repo variables** (Settings → Secrets and variables → Actions → Variables tab — variables, not secrets, because publishable keys are client-readable by design), passed to `flyctl deploy` as `--build-arg` from both workflow files. This is required because `NEXT_PUBLIC_*` values are inlined into the bundle at `next build` time, not read at runtime (see Next.js [environment variables docs](https://nextjs.org/docs/app/guides/environment-variables) for the inlining contract). `SITE_URL` stays a per-app **Fly secret** (set on production via `flyctl secrets set --app <app-name> SITE_URL=...`; preview apps get it set automatically by the preview workflow). `fly.toml` no longer has an `[env]` block.

## AI-Implement template files (do not treat as project docs)

[PLANNING.md](PLANNING.md) and [WORKFLOW.md](WORKFLOW.md) are **prompt templates** seeded by the ai-implement sync workflow. They are rendered (front matter stripped, `${VARS}` substituted) and sent to a separate Claude instance during planning/implementation runs. They are *not* documentation of this repo's architecture, though their "Repo context" sections are kept in sync with the real stack so that AI runs get accurate guidance.

The workflows in [.github/workflows/](.github/workflows/) named `claude-plan.yml`, `claude-implement.yml`, and `comment-trigger.yml` are managed by the ai-implement sync workflow — do not edit them directly; changes will be overwritten on the next sync. The `fly-deploy.yml` and `fly-preview.yml` workflows in the same directory are *not* sync-managed and are safe to edit.
