---
title: "List Command Printed Raw JSON Instead of Human-Readable Output"
date: 2026-06-30
category: docs/solutions/logic-errors/
module: notes-app
problem_type: logic_error
component: tooling
symptoms:
  - list command outputs raw JSON array instead of formatted lines
  - "empty vault shows empty array [] instead of a friendly message"
root_cause: logic_error
resolution_type: code_fix
severity: medium
tags:
  - cli
  - json-output
  - list-command
  - formatting
  - notes-app
---

# List Command Printed Raw JSON Instead of Human-Readable Output

## Problem

The notes-app `list` command printed raw JSON to the terminal instead of a human-readable list. The handler passed the parsed notes array directly to `JSON.stringify` and logged it, making the output unreadable for end users.

## Symptoms

- Running `notes list` displayed output such as `[{"id":1,"text":"Buy milk"},{"id":2,"text":"Call dentist"}]` instead of a formatted list.
- The vault's contents were technically present in the output but buried in JSON syntax, requiring manual parsing to read.
- An empty vault printed `[]` rather than a friendly "no entries" message.

## What Didn't Work

No failed approaches documented — fix was identified directly from code review.

## Solution

The `list` handler was changed to map each note entry to a `"<id>: <text>"` line and to print `"No entries yet."` when the vault is empty.

**Before:**

```js
function listNotes(vault) {
  const notes = JSON.parse(vault.read());
  console.log(JSON.stringify(notes));
}
```

**After:**

```js
function listNotes(vault) {
  const notes = JSON.parse(vault.read());

  if (notes.length === 0) {
    console.log("No entries yet.");
    return;
  }

  const lines = notes.map((note) => `${note.id}: ${note.text}`);
  console.log(lines.join("\n"));
}
```

With this fix, `notes list` now produces output like:

```
1: Buy milk
2: Call dentist
```

And an empty vault produces:

```
No entries yet.
```

## Why This Works

The root cause was that the handler serialised the in-memory array back to JSON (`JSON.stringify`) instead of formatting it for human consumption. JSON is the right *storage* format inside the vault file, but it is not a display format. By mapping each entry to `"<id>: <text>"` the handler separates the concerns of storage and presentation. The empty-vault guard removes a second UX problem where `[]` was confusing to users who expected a plain English message.

## Prevention

**Separate storage format from display format.** Whenever a command reads structured data from a file, the display layer should explicitly format the data for humans rather than echoing the serialised form.

**Always handle the empty-collection case explicitly.** Default-rendering an empty array as `[]` (or nothing) leaves users unsure whether the command succeeded or the store is genuinely empty.

**Add unit tests for both the populated and empty cases.** A minimal Vitest (or Jest) test file for the list handler:

```js
import { describe, it, expect, vi } from "vitest";
import { listNotes } from "../src/list";

describe("listNotes", () => {
  it("prints each note as '<id>: <text>'", () => {
    const vault = { read: () => JSON.stringify([{ id: 1, text: "Buy milk" }, { id: 2, text: "Call dentist" }]) };
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});

    listNotes(vault);

    expect(spy).toHaveBeenCalledWith("1: Buy milk\n2: Call dentist");
    spy.mockRestore();
  });

  it('prints "No entries yet." when the vault is empty', () => {
    const vault = { read: () => JSON.stringify([]) };
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});

    listNotes(vault);

    expect(spy).toHaveBeenCalledWith("No entries yet.");
    spy.mockRestore();
  });
});
```

**Code-review checklist item:** any `console.log(JSON.stringify(...))` in a user-facing command handler is a signal that the display layer is missing — flag it in PR review.

## Related Issues

- None documented.
