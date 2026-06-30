---
title: "notes-app delete command crashes with ENOENT when vault.json does not exist"
date: 2026-06-30
category: docs/solutions/runtime-errors/
module: notes-app
problem_type: runtime_error
component: tooling
symptoms:
  - "Running `delete <id>` on a fresh checkout throws an unhandled ENOENT exception"
  - "Command crashes instead of reporting a no-op when the store file is absent"
  - "`add` and `list` commands also fail before any note has been created"
root_cause: missing_validation
resolution_type: code_fix
severity: medium
tags:
  - nodejs
  - file-io
  - error-handling
  - enoent
  - notes-app
  - vault
  - graceful-fallback
  - regression-test
---

# notes-app delete command crashes with ENOENT when vault.json does not exist

## Problem

The notes-app `delete <id>` command crashed with an unhandled `ENOENT` exception whenever `vault.json` did not yet exist — that is, when a user attempted to delete a note before any note had ever been added. The crash surfaced as an uncaught Node.js error rather than a graceful "nothing to delete" response.

## Symptoms

- Running `delete <id>` on a fresh checkout (no `vault.json` present) threw:
  ```
  Error: ENOENT: no such file or directory, open 'vault.json'
  ```
- The same crash occurred for `list` and any other command that called `loadNotes()` before the file had been created by `add`.
- No user-friendly message was shown; the process exited with a non-zero status code.

## What Didn't Work

Investigation was straightforward — the root cause was identified directly from the error. No alternative approaches were attempted before reaching the correct fix. The stack trace pointed immediately to `fs.readFileSync` inside `loadNotes()`, making it clear the file-read boundary was not guarding against the "file does not yet exist" case.

## Solution

The fix is contained entirely in `loadNotes()`. Wrapping the `readFileSync` call in a try/catch and returning an empty array on `ENOENT` makes every consumer of `loadNotes()` behave correctly on a fresh checkout.

Before (broken):

```js
function loadNotes() {
  const raw = fs.readFileSync('vault.json', 'utf8');
  return JSON.parse(raw);
}
```

After (fixed):

```js
function loadNotes() {
  try {
    const raw = fs.readFileSync('vault.json', 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}
```

No call sites required changes. Because `add`, `list`, and `delete` all delegate to `loadNotes()`, the fix automatically covers every command.

## Why This Works

`fs.readFileSync` throws a system-level error with `err.code === 'ENOENT'` when the target path does not exist. Previously, `loadNotes()` made no attempt to catch this error, so it propagated up through the call stack and became an unhandled exception.

Catching `ENOENT` specifically and returning `[]` is the correct semantic because the absence of `vault.json` is not an error condition — it simply means no notes have been saved yet. An empty vault and a missing vault file are equivalent states from the application's perspective. Returning an empty array lets `delete` find no matching ID and exit cleanly, `list` print an empty list, and `add` write a new file as if starting fresh.

Re-throwing all other error codes (permissions errors, I/O errors, corrupt filesystem entries) is equally important. Silently swallowing every exception would hide real problems and make debugging significantly harder. The guard is intentionally narrow: only `ENOENT` gets the "empty vault" treatment.

## Prevention

- **Catch `ENOENT` at every file-read boundary where "file not existing" is a valid initial state.** Any function that reads optional persistent state with `fs.readFileSync` (or `fs.promises.readFile`) should apply the same pattern: catch `ENOENT`, return the appropriate empty/default value, and re-throw everything else.
- **Include a test for operations on a fresh or empty state.** Before this fix, the test suite only covered the happy path (vault already populated). Tests that exercise commands against a missing or empty store catch this class of bug at development time.
- **Regression test added:** `delete on a missing vault is a no-op` — this test asserts that running `delete` when `vault.json` does not exist exits without error and produces no output, preventing recurrence.

## Related Issues

- None. This is the first documented solution in this area.
