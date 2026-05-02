import { readFileSync, writeFileSync, existsSync } from 'node:fs';

/**
 * Shared state between sequential journey tests/projects.
 *
 * Each Playwright project runs in its own worker process, so in-memory
 * variables don't survive across phases. Use this helper to pass things
 * like a freshly-created postId from Phase 03 to Phase 10 (receiver).
 *
 * Usage:
 *   import { setState, getState } from '../../../playwright/journey-state';
 *   setState({ firstPostId: 'abc-123' });
 *   const { firstPostId } = getState();
 */

const STATE_PATH = 'playwright/.state/journey.json';

export type JourneyState = {
  firstPostId?: string;
  firstEventId?: string;
  receiverProfileId?: string;
  receiverUsername?: string;
  [key: string]: unknown;
};

export function getState(): JourneyState {
  if (!existsSync(STATE_PATH)) return {};
  try {
    return JSON.parse(readFileSync(STATE_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

export function setState(patch: JourneyState): JourneyState {
  const current = getState();
  const next = { ...current, ...patch };
  writeFileSync(STATE_PATH, JSON.stringify(next, null, 2), 'utf-8');
  return next;
}

export function resetState(): void {
  writeFileSync(STATE_PATH, '{}', 'utf-8');
}
