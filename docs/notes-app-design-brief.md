# Design Brief: CLI Notes App

## Objective

Build a minimal command-line notes application in Node.js/TypeScript with four capabilities: add a note, list all notes, delete a note by ID, and persist notes to a local JSON file.

## Scope

**In scope:**
- `notes add "<text>"` — append a new note with an auto-incremented integer ID
- `notes list` — print all notes with their IDs
- `notes delete <id>` — remove a note by ID
- JSON file persistence (e.g. `~/.notes.json` or `./notes.json`)
- Basic error handling (file not found → treat as empty, unknown ID → informative error)
- TypeScript source, compiled or run via `ts-node` / `tsx`

**Out of scope:**
- Search / filtering
- Tags or categories
- Multi-file or remote storage
- Interactive TUI
- Authentication or multi-user support
- Edit / update of existing notes

---

## Decomposition Table

| # | Task | Shape | Label | Blocked by |
|---|------|-------|-------|------------|
| 1 | **Scaffold project** — `package.json`, `tsconfig.json`, `tsx` dev dep, entry point `src/index.ts`, `npm test` wired to Vitest | wide-and-shallow | setup | — |
| 2 | **Persistence layer** — `src/store.ts` with `loadNotes()` / `saveNotes()` reading/writing a typed `Note[]` JSON file; unit tests for round-trip and missing-file fallback | deep-and-targeted | core | 1 |
| 3 | **`add` command** — parse CLI arg, generate next ID (`max(ids) + 1`, default 1), append to store, print confirmation; unit tests | deep-and-targeted | feature | 2 |
| 4 | **`list` command** — load store and pretty-print notes (or "No notes yet."); unit tests | deep-and-targeted | feature | 2 |
| 5 | **`delete` command** — remove note by ID, error if not found, save; unit tests | deep-and-targeted | feature | 2 |
| 6 | **CLI wiring** — `src/index.ts` dispatches `add` / `list` / `delete` sub-commands; unknown command prints usage; integration smoke test | wide-and-shallow | integration | 3, 4, 5 |

---

## Critical Path

**1 → 2 → 3 → 6** (scaffold → store → add → CLI wiring)

Issues 3, 4, and 5 all depend on 2 and can be developed in parallel once the persistence layer is done. Issue 6 depends on all three command issues.

---

## Open Questions

1. **File location** — should the JSON file default to a fixed path (`./notes.json`) for simplicity, or follow XDG conventions (`~/.local/share/notes/notes.json`)? XDG is more correct for a real tool but adds complexity.
2. **ID strategy** — auto-incrementing integer IDs are simplest, but deleted IDs are never reused. Is that acceptable, or should IDs be compacted on delete?
3. **Output format for `list`** — plain text (`1: Buy milk`) vs structured (aligned columns, timestamps)? Adding a `createdAt` timestamp to the `Note` type is a small change but affects the schema from issue 2.
4. **Error exit codes** — should the CLI exit with a non-zero code on user errors (unknown ID, bad args) for scriptability, or is a printed message sufficient for this scope?
