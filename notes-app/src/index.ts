// [notes-cli-house-style skill applied]

import { resolve } from "path";
import { createStorage } from "./storage";

const vaultPath = resolve(process.cwd(), "notes-app", "vault.json");
const storage = createStorage(vaultPath);

const [, , command, ...args] = process.argv;

switch (command) {
  case "add": {
    const text = args.join(" ");
    if (!text) {
      console.error("Usage: notes add <text>");
      process.exit(1);
    }
    const note = storage.add(text);
    console.log(`Entry #${note.id} added to the vault.`);
    break;
  }

  case "list": {
    const entries = storage.list();
    if (entries.length === 0) {
      console.log("The vault is empty.");
    } else {
      for (const entry of entries) {
        console.log(`[${entry.id}] ${entry.text}`);
      }
    }
    break;
  }

  case "delete": {
    const id = parseInt(args[0], 10);
    if (isNaN(id)) {
      console.error("Usage: notes delete <id>");
      process.exit(1);
    }
    const deleted = storage.remove(id);
    if (deleted) {
      console.log(`Entry #${id} removed from the vault.`);
    } else {
      console.error(`No entry with ID ${id} found in the vault.`);
      process.exit(1);
    }
    break;
  }

  default:
    console.error("Commands: add <text> | list | delete <id>");
    process.exit(1);
}
