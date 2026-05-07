# orchestrator-hello-world-test

This repository was created solely to test the functionality of AI-Implement. It is not a production project and contains no real application code.

## Purpose

This repository exists to validate that [AI Implement](https://github.com/BuildDownAI/AI-Implement)'s end-to-end configuration is set up correctly. When the AI agent successfully opens and merges a pull request in this repository, it confirms that the integration between Linear, GitHub, and AI Implement is functioning as expected.

## What success looks like

A successfully merged pull request authored by the AI agent — in response to a Linear issue — is the proof that the configuration is working. No application runs; the act of implementing a change is itself the test.

## Running Locally

**Requirements:** Node.js 22 LTS (or later). If you use [nvm](https://github.com/nvm-sh/nvm), run `nvm use` in the repo root to switch to the pinned version automatically.

```bash
npm install
npm run dev
```

The dev server starts on port 3000 by default. Open http://localhost:3000 in your browser to see the hello-world page. To use a different port, pass it via the `--port` flag or `PORT` env var:

```bash
PORT=8080 npm run dev
```

For a production build:

```bash
npm run build
npm start
```

To run the test suite:

```bash
npm test
```

## Repository structure

- `app/page.tsx` — the home page (rendered by the App Router on `GET /`).
- `app/layout.tsx` — root HTML shell shared by every route.
- `app/globals.css` — Tailwind directives and the shadcn theme variables.
- `components/ui/` — shadcn components copied into the repo (e.g. `button.tsx`). Add more with `npx shadcn@latest add <component>`.
- `lib/utils.ts` — the `cn()` helper used by shadcn components to merge Tailwind classes.
- `test/page.test.tsx` — Vitest + React Testing Library test for the home page.
- `PLANNING.md` — Template file used by AI Implement to guide the planning phase of each issue.
- `WORKFLOW.md` — Template file that defines the workflow steps the AI agent follows when implementing issues.
