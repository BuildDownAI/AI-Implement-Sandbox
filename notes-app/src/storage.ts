// [notes-cli-house-style skill applied]

import { readFileSync, writeFileSync, existsSync } from "fs";
import type { Note } from "./types";

function load(vaultPath: string): Note[] {
  if (!existsSync(vaultPath)) return [];
  return JSON.parse(readFileSync(vaultPath, "utf-8")) as Note[];
}

function save(vaultPath: string, notes: Note[]): void {
  writeFileSync(vaultPath, JSON.stringify(notes, null, 2));
}

export function createStorage(vaultPath: string) {
  return {
    add(text: string): Note {
      const notes = load(vaultPath);
      const id = notes.length > 0 ? Math.max(...notes.map((n) => n.id)) + 1 : 1;
      const note: Note = { id, text, createdAt: new Date().toISOString() };
      notes.push(note);
      save(vaultPath, notes);
      return note;
    },

    list(): Note[] {
      return load(vaultPath);
    },

    remove(id: number): boolean {
      const notes = load(vaultPath);
      const filtered = notes.filter((n) => n.id !== id);
      if (filtered.length === notes.length) return false;
      save(vaultPath, filtered);
      return true;
    },
  };
}
