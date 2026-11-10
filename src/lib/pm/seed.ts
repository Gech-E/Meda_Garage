import type { AppState } from "./types";

// Start each new pilot session empty. Requests and quotes must come from a participant.
export function seedState(): AppState {
  return { version: 2, requests: [], feedback: [] };
}
