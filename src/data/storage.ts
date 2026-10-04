import type { Notebook, Note } from "./types";

const NOTEBOOKS_KEY = "note-app.notebooks";
const NOTES_KEY = "note-app.notes";
const EXAMPLE_NOTE_SEEDED_KEY = "note-app.example-note-seeded";
const EXAMPLE_NOTE_DELETED_KEY = "note-app.example-note-deleted";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Failed to read from localStorage key "${key}":`, err);
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to write to localStorage key "${key}":`, err);
  }
}

export function loadNotebooks(): Notebook[] {
  return read(NOTEBOOKS_KEY, []);
}

export function saveNotebooks(notebooks: Notebook[]): void {
  write(NOTEBOOKS_KEY, notebooks);
}

export function loadNotes(): Note[] {
  return read(NOTES_KEY, []);
}

export function saveNotes(notes: Note[]): void {
  write(NOTES_KEY, notes);
}

export function hasSeededExampleNote(): boolean {
  return read(EXAMPLE_NOTE_SEEDED_KEY, false);
}

export function markExampleNoteSeeded(): void {
  write(EXAMPLE_NOTE_SEEDED_KEY, true);
}

export function hasDeletedExampleNote(): boolean {
  return read(EXAMPLE_NOTE_DELETED_KEY, false);
}

export function markExampleNoteDeleted(): void {
  write(EXAMPLE_NOTE_DELETED_KEY, true);
}

export function clearExampleNoteDeleted(): void {
  write(EXAMPLE_NOTE_DELETED_KEY, false);
}
