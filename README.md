# AI-Implement-Sandbox

> **⚠️ Hardcoded Legacy Name — Locations to Generalize**
>
> The old repo name `orchestrator-hello-world-test` is still hardcoded in the following non-README files. Each will need to be updated when the Fly.io infrastructure is renamed (tracked in AII-161). **Do not edit these files in this PR — they are flagged here for follow-up only.**
>
> | File | Line | Value | Notes |
> |------|------|-------|-------|
> | `fly.toml` | 1 | `# fly.toml app configuration file generated for orchestrator-hello-world-test` | Comment — update when Fly app is renamed |
> | `fly.toml` | 6 | `app = 'orchestrator-hello-world-test'` | Live Fly app name — renaming requires `flyctl apps create` + traffic cutover |
> | `.github/workflows/fly-preview.yml` | 26 | `APP_NAME: orchestrator-hello-world-test-pr-${{ github.event.pull_request.number }}` | Preview app naming — must align with production Fly rename to avoid orphaning in-flight previews |
> | `supabase/config.toml` | 5 | `project_id = "orchestrator-hello-world-test"` | Supabase CLI project identifier — update via `supabase unlink && supabase link` after rename |
> | `package.json` | 2 | `"name": "orchestrator-hello-world-test"` | Inert for a `"private": true` package; safe to rename independently |
> | `package-lock.json` | 2, 8 | `"name": "orchestrator-hello-world-test"` | Auto-generated from `package.json`; regenerates on next `npm install` after `package.json` is updated |
> | `CLAUDE.md` | 218 | `orchestrator-hello-world-test-pr-<N>` in Deployment section | AI planning context — update alongside `fly-preview.yml` so future agent runs get accurate guidance |
>
> **TODO: remove this section once all occurrences above are generalized.**

This repository was created solely to test the functionality of AI-Implement. It is not a production project and contains no real application logic.

## Purpose

This repository exists to validate that [AI Implement](https://github.com/BuildDownAI/AI-Implement)'s end-to-end configuration is set up correctly. When the AI agent successfully opens and merges a pull request in this repository, it confirms that the integration between Linear, GitHub, and AI Implement is functioning as expected.

## What success looks like

A successfully merged pull request authored by the AI agent — in response to a Linear issue — is the proof that the configuration is working. The application itself is intentionally minimal; the act of implementing a change against it is the test.

## Stack

- **Next.js 15** (App Router, React Server Components)
- **React 19** + **TypeScript**
- **Tailwind CSS 3** + **shadcn/ui**
- **Supabase** for Auth (email/password, GitHub OAuth, password reset) and Postgres with Row-Level Security
- **zod** for runtime validation
- **Vitest** + **React Testing Library**
- **Fly.io** for deployment (production + per-PR previews)

## Features

- **Authentication**: email/password signup + login, GitHub OAuth, email verification, password reset, logout
- **Projects** (per-user, RLS-isolated): list (paginated), detail, create, edit, delete-with-confirmation
- **Profile + account settings**: display name, avatar upload (via Supabase Storage), change email (with double-confirmation security), change password, delete account (via a `SECURITY DEFINER` Postgres function — no service-role key exposed to app code). Profile page conditionally renders email/password sections for email users only; OAuth users see a "managed by provider" notice instead.
- **UX infrastructure**: top nav header with user dropdown, inline + per-field form errors via React 19's `useActionState`, success/error toasts via [sonner](https://sonner.emilkowal.ski), loading-state skeletons, error boundaries, and `not-found.tsx` fallbacks at the route group level
- **Dark mode** with system-preference detection and persistence across refreshes (via [next-themes](https://github.com/pacocoursey/next-themes))
- **Per-PR preview deploys** on Fly.io

## Running Locally

**Requirements:** Node.js 22 LTS (or later). If you use [nvm](https://github.com/nvm-sh/nvm), run `nvm use` in the repo root to switch to the pinned version automatically.

### 1. Install dependencies

```bash
npm install
```

### 2. Set environment variables

Copy the template:

```bash
cp .env.local.example .env.local
```

Then fill in your Supabase project's values:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<sb_publishable_...>
SITE_URL=http://localhost:3000
```

Get the URL and publishable key from **Project Settings → API** in the Supabase dashboard.

Optional: add `NEXT_PUBLIC_GITHUB_OAUTH_ENABLED=false` to disable the GitHub OAuth button (defaults to enabled). Use this if your environment doesn't have GitHub OAuth configured (e.g. a trial sandbox).

### 3. Configure Supabase (one-time)

In your Supabase project:

- **Authentication → URL Configuration → Site URL** — `http://localhost:3000`
- **Authentication → URL Configuration → Redirect URLs** — add `http://localhost:3000/**`
- **Authentication → Email Templates** — update **Confirm signup** and **Reset Password** to use the PKCE format with `{{ .RedirectTo }}` (not `{{ .SiteURL }}` — the redirect placeholder is substituted with the per-environment URL passed by the auth action's `emailRedirectTo` param, so production / PR-preview / local-dev all generate the correct link without dashboard re-configuration):
  ```html
  <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email&next=/">
    Confirm your email
  </a>
  ```
  (Use `type=email` for signup, `type=recovery` and `next=/reset-password` for password reset.) Note: the template does **not** include `/auth/confirm` because the action passes the full path (`${SITE_URL}/auth/confirm`) as `emailRedirectTo`, which `{{ .RedirectTo }}` substitutes in whole.

For GitHub OAuth, also:

- Register an OAuth app at [github.com/settings/developers](https://github.com/settings/developers) with callback URL `https://<project-ref>.supabase.co/auth/v1/callback`.
- Paste the Client ID and Client Secret into **Supabase → Authentication → Providers → GitHub**.

To disable GitHub OAuth in a given environment, set `NEXT_PUBLIC_GITHUB_OAUTH_ENABLED=false` (in `.env.local` for dev, as a build-arg or env var for deploys). The `/login` page hides the GitHub button and the action rejects with `"GitHub OAuth is disabled"` if invoked directly. Useful for trial sandboxes that don't have OAuth provider config.

### 4. Apply database migrations

Migrations live in [supabase/migrations/](supabase/migrations/) as numbered SQL files. Apply them all in one shot via the CLI:

```bash
npx supabase login         # one-time PAT auth
npx supabase link --project-ref <your-project-ref>
npx supabase db push       # applies all migrations 00001-00009 in order
```

This includes the avatars Storage bucket + policies (00007 + 00008) and the sample-projects-on-signup trigger (00009) — no dashboard intervention needed.

**For an existing dev project** that has users from before migration 00005 (profiles trigger), backfill profiles for those users via the SQL editor:
```sql
insert into profiles (user_id)
select id from auth.users
where id not in (select user_id from profiles);
```

The 00009 sample-projects trigger only fires on *new* signups — existing dev users won't get sample data retroactively. Add rows by hand if you want them.

### 5. Avatars Storage bucket (handled by migration)

The `avatars` bucket, its MIME allowlist (PNG/JPEG/WebP/GIF), the 5 MB size cap, and four per-row Storage policies are created by migrations [`00007_avatars_bucket.sql`](supabase/migrations/00007_avatars_bucket.sql) + [`00008_avatars_rls.sql`](supabase/migrations/00008_avatars_rls.sql). Applied automatically by `npx supabase db push` in step 4 — no dashboard work needed.

File path convention is `<user_id>/<filename>` — the per-user-folder write policies enforce it via `(storage.foldername(name))[1] = auth.uid()::text`.

### 6. Generate TypeScript types from the schema

After every migration (including ones that only add Postgres functions or triggers), regenerate the TypeScript types:

```bash
npm run db:types
```

This populates [lib/supabase/database.types.ts](lib/supabase/database.types.ts) so every Supabase query is fully type-safe. Already linked from Step 4 above — no separate login/link needed.

### 7. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The home page reflects whether you're signed in; unauthenticated users are redirected to `/login`.

To use a different port:
```bash
PORT=8080 npm run dev
```

### Production build (for sanity-checking before deploy)

```bash
npm run build
npm start
```

## Testing

```bash
npm test
```

Tests live in [test/](test/) and use Vitest + React Testing Library. Client Component tests mock `next/navigation` and the actions modules; the Server Component home page test mocks the Supabase server client.

Run a single file:
```bash
npx vitest run test/login-form.test.tsx
```

Filter by test name:
```bash
npx vitest run -t 'renders login mode by default'
```

## Deployment (Fly.io)

Production and preview deploys are automated via GitHub Actions:

- **Production** ([fly-deploy.yml](.github/workflows/fly-deploy.yml)) — deploys on push to `main` (or via manual `workflow_dispatch`). Requires repo secret `FLY_API_TOKEN` scoped to the production app.
- **Per-PR previews** ([fly-preview.yml](.github/workflows/fly-preview.yml)) — creates `ai-implement-sandbox-pr-<N>` on PR open, deploys on each push, destroys on PR close. Requires repo secret `FLY_API_TOKEN_PREVIEW` (org-scoped) and repo variable `FLY_ORG`.

Build-time env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) are stored as **GitHub repo variables** (Settings → Secrets and variables → Actions → Variables tab) and passed to `flyctl deploy` as `--build-arg` by both workflow files. This is required because `NEXT_PUBLIC_*` values are inlined into the compiled bundle at build time, not read at runtime.

`SITE_URL` is a per-app Fly secret because each environment needs its own value. Set on production with `flyctl secrets set --app <app-name> SITE_URL=https://...`. Preview apps get their `SITE_URL` set automatically by [fly-preview.yml](.github/workflows/fly-preview.yml).

Add production and preview URLs to your Supabase **Redirect URLs** allowlist to make auth flows work on deployed environments:
```
https://ai-implement-sandbox.fly.dev/**
https://ai-implement-sandbox-pr-*.fly.dev/**
```

## Repository structure

| Path | Purpose |
|------|---------|
| `app/(app)/page.tsx` | Home page (`/`), public; renders conditionally based on auth state |
| `app/(app)/layout.tsx` | Authenticated-shell layout with the top nav `<Header />` + `<main>` wrapper for all (app) routes |
| `app/(app)/header.tsx` | Top navigation: brand link, Projects + Profile nav, theme toggle, user dropdown with email + Log out |
| `app/(app)/error.tsx`, `app/(auth)/error.tsx` | Error boundaries for each route group (renders on render exceptions) |
| `app/(app)/projects/` | Projects CRUD — list, detail, new, edit |
| `app/(app)/projects/queries.ts` | Read helpers (e.g. `getProject(id)`); also re-exports the `Project` row type |
| `app/(app)/projects/actions.ts` | Server Actions for create/update/delete |
| `app/(app)/projects/schema.ts` | zod schema for project input + inferred type |
| `app/(app)/projects/loading.tsx` (+ `[projectId]/loading.tsx`, `[projectId]/edit/loading.tsx`) | Skeleton fallbacks for data-fetching routes |
| `app/(app)/projects/not-found.tsx` | "Project not found" boundary triggered by `notFound()` from detail/edit pages |
| `app/(app)/projects/project-deleted-flash.tsx` | Client component that reads a `sessionStorage` flag set during delete and fires a toast |
| `app/(app)/profile/` | Profile + account settings (display name, avatar, email, password, delete account) |
| `app/(app)/profile/queries.ts` | `getProfile()` and the `Profile` type (DB row + computed `avatar_url`) |
| `app/(app)/profile/actions.ts` | Server Actions: `updateProfile`, `updateEmail`, `updatePassword`, `deleteAccount` |
| `app/(app)/profile/schema.ts` | zod schemas for profile, email, and password inputs |
| `app/(app)/profile/loading.tsx` | Sectioned-card skeleton for the profile page |
| `app/(auth)/login/` | Login + register form, GitHub OAuth, forgot-password link |
| `app/(auth)/login/account-deleted-flash.tsx` | Toast after account deletion redirect (sessionStorage flash) |
| `app/(auth)/login/auth-callback-error-toast.tsx` | Toast for errors propagated from `/auth/callback` and `/auth/confirm` |
| `app/(auth)/forgot-password/` | Password reset request |
| `app/(auth)/reset-password/` | New-password form (entered via recovery email link) |
| `app/(auth)/layout.tsx` | Shared centered-card layout for auth pages |
| `app/auth/confirm/route.ts` | Email/recovery OTP verifier |
| `app/auth/callback/route.ts` | OAuth code-for-session exchanger |
| `app/layout.tsx` + `app/globals.css` | Root HTML shell, Tailwind directives, shadcn theme vars, `<Toaster />`, `<ThemeProvider />` |
| `app/not-found.tsx` | Global 404 page for unmatched routes |
| `components/ui/` | shadcn primitives (Button, Input, Textarea, Select, Field, Card, Badge, AlertDialog, DropdownMenu, Avatar, Skeleton, Empty, Separator, Label, Sonner) |
| `components/icons/github.tsx` | Inline GitHub SVG (lucide's `Github` is deprecated) |
| `components/theme-toggle.tsx` | Dark mode toggle wired to next-themes (persists in localStorage) |
| `components/submit-button.tsx` | Form submit button that reads `useFormStatus().pending` to disable + show a `pendingLabel` |
| `lib/form-state.ts` | `FormState` shape (`{ error?, fieldErrors?, message? }`) returned by Server Actions + `toFieldErrors()` helper that maps zod's `flattenError` output into the shape |
| `lib/schemas/auth-fields.ts` | Shared zod field-level primitives (`emailField`, `passwordField`) imported by auth + profile schemas |
| `lib/supabase/{client,server,proxy}.ts` | Three Supabase client factories — one per execution context |
| `lib/supabase/database.types.ts` | Generated TS types from the Supabase schema (`npm run db:types`) |
| `supabase/migrations/` | Versioned SQL files defining tables, indexes, and RLS policies |
| `middleware.ts` | Refreshes Supabase session on every request; gates protected + auth-only routes |
| `test/` | Vitest test suite |
| `fly.toml`, `Dockerfile`, `docker-entrypoint.js` | Fly.io deployment config |
| `PLANNING.md`, `WORKFLOW.md` | AI Implement prompt templates (rendered, not docs) |

See [CLAUDE.md](CLAUDE.md) for architectural conventions used in this repo.
