import { useSyncExternalStore } from "react";
import type { AppState } from "./types";
import { seedState } from "./seed";
import { migrateState } from "./logic";

/** Storage abstraction: swap this adapter for a backend implementation later. */
export interface StorageAdapter {
  load(): AppState | null;
  save(state: AppState): void;
}

// Historical key name kept on purpose so data from earlier interview rounds still loads.
const KEY = "partmatch.v1";

export const localStorageAdapter: StorageAdapter = {
  load() {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      const migrated = migrateState(JSON.parse(raw));
      if (!migrated) throw new Error("unrecognised data");
      return migrated;
    } catch {
      // Keep unreadable data aside instead of silently destroying it.
      if (raw) {
        try {
          window.localStorage.setItem(`${KEY}.unreadable-${Date.now()}`, raw);
        } catch {
          /* storage full: nothing more we can do */
        }
      }
      return null;
    }
  },
  save(state) {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  },
};

let adapter: StorageAdapter = localStorageAdapter;
let state: AppState | null = null;
const listeners = new Set<() => void>();

export function setAdapter(a: StorageAdapter) {
  adapter = a;
  state = null;
}

function getState(): AppState {
  if (!state) {
    state = adapter.load() ?? seedState();
  }
  return state;
}

export function commit(fn: (s: AppState) => AppState): AppState {
  const next = fn(getState());
  try {
    adapter.save(next);
  } catch {
    throw new Error("Could not save in this browser (storage full?). Try a smaller photo or export and reset.");
  }
  state = next;
  listeners.forEach((l) => l());
  return next;
}

export function resetDemo() {
  commit(() => seedState());
}

function onStorage(e: StorageEvent) {
  // Another tab of this same browser changed the data: reload it.
  if (e.key === KEY) {
    state = null;
    listeners.forEach((l) => l());
  }
}

function subscribe(l: () => void) {
  if (listeners.size === 0 && typeof window !== "undefined") window.addEventListener("storage", onStorage);
  listeners.add(l);
  return () => {
    listeners.delete(l);
    if (listeners.size === 0 && typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

/** Returns null during server render / hydration, then the stored state. */
export function useAppState(): AppState | null {
  return useSyncExternalStore(subscribe, getState, () => null);
}