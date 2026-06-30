// [notes-cli-house-style skill applied]

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { createStorage } from "@/notes-app/src/storage";

describe("notes storage (vault round-trip)", () => {
  let tmpDir: string;
  let vaultPath: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "notes-test-"));
    vaultPath = join(tmpDir, "vault.json");
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true });
  });

  it("starts empty when vault does not exist", () => {
    const storage = createStorage(vaultPath);
    expect(storage.list()).toEqual([]);
  });

  it("adds an entry and persists it to disk", () => {
    const storage = createStorage(vaultPath);
    const note = storage.add("hello world");
    expect(note.id).toBe(1);
    expect(note.text).toBe("hello world");

    const storage2 = createStorage(vaultPath);
    const entries = storage2.list();
    expect(entries).toHaveLength(1);
    expect(entries[0].text).toBe("hello world");
  });

  it("assigns incrementing IDs", () => {
    const storage = createStorage(vaultPath);
    const a = storage.add("first");
    const b = storage.add("second");
    expect(b.id).toBe(a.id + 1);
  });

  it("deletes an entry by ID", () => {
    const storage = createStorage(vaultPath);
    const note = storage.add("to be deleted");
    expect(storage.remove(note.id)).toBe(true);
    expect(storage.list()).toEqual([]);
  });

  it("returns false when deleting a non-existent ID", () => {
    const storage = createStorage(vaultPath);
    expect(storage.remove(999)).toBe(false);
  });

  it("preserves remaining entries after delete", () => {
    const storage = createStorage(vaultPath);
    storage.add("keep me");
    const toDelete = storage.add("delete me");
    storage.add("keep me too");
    storage.remove(toDelete.id);
    const remaining = storage.list();
    expect(remaining).toHaveLength(2);
    expect(remaining.map((n) => n.text)).toEqual(["keep me", "keep me too"]);
  });
});
