// Tiny shared flag: is the app tour on screen? Other first-run prompts (location sheet)
// wait until it is done, so the user never gets two overlays at once.
import { useSyncExternalStore } from 'react';

let tourActive = false;
const listeners = new Set<() => void>();

export function setTourActive(active: boolean) {
  if (tourActive === active) return;
  tourActive = active;
  listeners.forEach((l) => l());
}

export function useTourActive(): boolean {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => tourActive,
    () => false,
  );
}
