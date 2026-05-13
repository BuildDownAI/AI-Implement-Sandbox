# orchestrator-hello-world-test

This repository was created solely to test the functionality of AI-Implement. It is not a production project and contains no real application logic.

## Purpose

This repository exists to validate that [AI Implement](https://github.com/BuildDownAI/AI-Implement)'s end-to-end configuration is set up correctly. When the AI agent successfully opens and merges a pull request in this repository, it confirms that the integration between Linear, GitHub, and AI Implement is functioning as expected.

## What success looks like

A successfully merged pull request authored by the AI agent — in response to a Linear issue — is the proof that the configuration is working. The application itself is intentionally minimal; the act of implementing a change against it is the test.

## Stack

- **Next.js 15** (App Router, React Server Components)
- **React 19** + **TypeScript**
- **Tailwind CSS 3** + **shadcn/ui**
- **Supabase Auth** (email/password, GitHub OAuth, password reset)
- **Vitest** + **React Testing Library**
- **Fly.io** for deployment (production + per-PR previews)

## Running Locally

**Requirements:** Node.js 22 LTS (or later). If you use [nvm](https://github.com/nvm-sh/nvm), run `nvm use` in the repo root to switch to the pinned version automatically.

### 1. Install dependencies

```bash
npm install
```

### 2. Set environment variables

Create `.env.local` in the repo root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<sb_publishable_...>
SITE_URL=http://localhost:3000
```

Get the Supabase URL and publishable key from your Supabase project dashboard → **Project Settings → API**.

### 3. Configure Supabase (one-time)

In your Supabase project:

- **Authentication → URL Configuration → Site URL** — `http://localhost:3000`
- **Authentication → URL Configuration → Redirect URLs** — add `http://localhost:3000/**`
- **Authentication → Email Templates** — update **Confirm signup** and **Reset Password** to use the PKCE format:
  ```html
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/">
    Confirm your email
  </a>
  ```
  (Use `type=email` for signup, `type=recovery` and `next=/reset-password` for password reset.)

For GitHub OAuth, also:

- Register an OAuth app at [github.com/settings/developers](https://github.com/settings/developers) with callback URL `https://<project-ref>.supabase.co/auth/v1/callback`.
- Paste the Client ID and Client Secret into **Supabase → Authentication → Providers → GitHub**.

### 4. Run the dev server

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
- **Per-PR previews** ([fly-preview.yml](.github/workflows/fly-preview.yml)) — creates `orchestrator-hello-world-test-pr-<N>` on PR open, deploys on each push, destroys on PR close. Requires repo secret `FLY_API_TOKEN_PREVIEW` (org-scoped) and repo variable `FLY_ORG`.

`NEXT_PUBLIC_SUPABASE_*` values live in [fly.toml](fly.toml) under `[env]`. The `SITE_URL` is per-app (Fly secret) — set on production with `flyctl secrets set --app <app-name> SITE_URL=https://...`. Preview apps get their `SITE_URL` set automatically by the workflow.

Add production and preview URLs to your Supabase **Redirect URLs** allowlist to make auth flows work on deployed environments:
```
https://orchestrator-hello-world-test.fly.dev/**
https://orchestrator-hello-world-test-pr-*.fly.dev/**
```

## Repository structure

| Path | Purpose |
|------|---------|
| `app/(app)/page.tsx` | Home page (authenticated; `/`) |
| `app/(auth)/login/` | Login + register form, GitHub OAuth, forgot-password link |
| `app/(auth)/forgot-password/` | Password reset request |
| `app/(auth)/reset-password/` | New-password form (entered via recovery email link) |
| `app/(auth)/layout.tsx` | Shared centered-card layout for auth pages |
| `app/auth/confirm/route.ts` | Email/recovery OTP verifier |
| `app/auth/callback/route.ts` | OAuth code-for-session exchanger |
| `app/layout.tsx` + `app/globals.css` | Root HTML shell, Tailwind directives, shadcn theme variables |
| `components/ui/` | shadcn primitives (Button, Input, Label, Separator, Field) |
| `components/icons/github.tsx` | Inline GitHub SVG (lucide's `Github` is deprecated) |
| `components/theme-toggle.tsx` | Dark mode toggle (Client Component example) |
| `lib/supabase/{client,server,proxy}.ts` | Three Supabase client factories — one per execution context |
| `middleware.ts` | Refreshes Supabase session on every request; gates protected routes |
| `test/` | Vitest test suite |
| `fly.toml`, `Dockerfile`, `docker-entrypoint.js` | Fly.io deployment config |
| `PLANNING.md`, `WORKFLOW.md` | AI Implement prompt templates (rendered, not docs) |

See [CLAUDE.md](CLAUDE.md) for architectural conventions used in this repo.
