# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose of this repo

This is **not a real application** — it is a scaffold whose sole purpose is to validate the [AI Implement](https://github.com/BuildDownAI/AI-Implement) end-to-end integration (Linear ↔ GitHub ↔ AI-Implement). The "feature" being verified is that an AI agent can take a Linear issue, open a PR against this repo, and have it merge cleanly. The Next.js + shadcn home page exists only so there is something concrete to modify, run, and test.

When implementing changes here, prefer **minimal, conventional** edits. Adding heavy abstractions, new dependencies, or architectural reshaping is almost always out of scope — the code is intentionally small.

## Commands

- `npm install` — install dependencies (Node.js **22+** required; see [.nvmrc](.nvmrc) — run `nvm use`)
- `npm run dev` — start the Next.js dev server (port 3000; override with `PORT=8080 npm run dev`)
- `npm run build` — production build (`next build`)
- `npm start` — serve the production build (`next start`); run `npm run build` first
- `npm test` — run the Vitest suite (`vitest run`)
- Run a single test file: `npx vitest run test/page.test.tsx`
- Run in watch mode: `npx vitest`
- Filter by test name: `npx vitest run -t 'renders the Hello World heading'`
- `npm run lint` — run `next lint`
- Add a new shadcn component: `npx shadcn@latest add <name>` (e.g. `button`, `card`, `dialog`) — files land in [components/ui/](components/ui/)

## Architecture

The App Router carries the entire app:

- [app/page.tsx](app/page.tsx) — the home page, served on `GET /`. **This is a Server Component** (default in the App Router) — it renders to HTML on the server with no JS shipped to the client. Add `"use client"` at the top of a file only when it needs browser-only APIs, hooks like `useState`, or event handlers.
- [app/layout.tsx](app/layout.tsx) — the root HTML shell wrapping every route; imports [app/globals.css](app/globals.css).
- [app/globals.css](app/globals.css) — Tailwind directives plus the shadcn theme variables (HSL CSS custom properties for `--background`, `--primary`, etc.). The `.dark` class block is the dark-mode palette.
- [components/ui/](components/ui/) — shadcn components, copied into the repo as source files (not imported from a package). Edit them in place; add new ones with `npx shadcn@latest add <component>`. Configuration lives in [components.json](components.json).
- [lib/utils.ts](lib/utils.ts) — the `cn()` helper (`clsx` + `tailwind-merge`) that every shadcn component uses to merge Tailwind classes safely.
- [test/page.test.tsx](test/page.test.tsx) — Vitest + React Testing Library tests. Setup in [test/setup.ts](test/setup.ts) registers `@testing-library/jest-dom` matchers. Configured in [vitest.config.ts](vitest.config.ts) (jsdom environment, `@/*` path alias).

When adding a route: create `app/<route>/page.tsx`. For an HTTP API endpoint, create `app/api/<route>/route.ts` and export named `GET`/`POST`/etc. functions. Tests for new pages or components follow the existing supertest-free RTL pattern in [test/page.test.tsx](test/page.test.tsx).

## Key conventions

- **TypeScript everywhere** — `.tsx` for components, `.ts` for non-JSX modules. shadcn assumes TS.
- **Path alias `@/*`** maps to the repo root (configured in both [tsconfig.json](tsconfig.json) and [vitest.config.ts](vitest.config.ts)). Prefer `@/components/ui/button` over relative paths.
- **Styling is Tailwind-only** — no CSS modules, no `style={...}` unless dynamic. Compose utility classes; reach for `cn()` when conditionally combining them.
- **No new dependencies without a clear reason** — the scaffold is deliberately small.

## AI-Implement template files (do not treat as project docs)

[PLANNING.md](PLANNING.md) and [WORKFLOW.md](WORKFLOW.md) are **prompt templates** seeded by the ai-implement sync workflow. They are rendered (front matter stripped, `${VARS}` substituted) and sent to a separate Claude instance during planning/implementation runs. They are *not* documentation of this repo's architecture, though their "Repo context" sections are kept in sync with the real stack so that AI runs get accurate guidance.

The workflows in [.github/workflows/](.github/workflows/) (`claude-plan.yml`, `claude-implement.yml`, `comment-trigger.yml`) are managed by the ai-implement sync workflow — do not edit them directly; changes will be overwritten on the next sync.
