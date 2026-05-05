# orchestrator-hello-world-test

This repository was created solely to test the functionality of AI-Implement. It is not a production project and contains no real application code.

## Purpose

This repository exists to validate that [AI Implement](https://aiimplement.com)'s end-to-end configuration is set up correctly. When the AI agent successfully opens and merges a pull request in this repository, it confirms that the integration between Linear, GitHub, and AI Implement is functioning as expected.

## What success looks like

A successfully merged pull request authored by the AI agent — in response to a Linear issue — is the proof that the configuration is working. No application runs; the act of implementing a change is itself the test.

## Running Locally

**Requirements:** Node.js 22 LTS (or later). If you use [nvm](https://github.com/nvm-sh/nvm), run `nvm use` in the repo root to switch to the pinned version automatically.

```bash
npm install
npm start
```

The server starts on port 3000 by default. Open http://localhost:3000 in your browser to see the hello-world page. To use a different port, set the `PORT` environment variable before starting:

```bash
PORT=8080 npm start
```

To run the test suite:

```bash
npm test
```

## Repository structure

- `src/app.js` — Express application with the `GET /` route.
- `views/index.ejs` — EJS template rendered by the root route.
- `test/app.test.js` — Integration tests using Node's built-in test runner.
- `PLANNING.md` — Template file used by AI Implement to guide the planning phase of each issue.
- `WORKFLOW.md` — Template file that defines the workflow steps the AI agent follows when implementing issues.
