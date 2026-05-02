import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Ensures auth-state files exist before any project starts.
 * Without this, Playwright crashes on first run because the
 * `storageState: 'playwright/.auth/user.json'` path doesn't exist yet.
 *
 * Real auth state is written by the `auth-setup` project (Phase 01).
 */
const EMPTY_STATE = JSON.stringify({ cookies: [], origins: [] });

function ensureFile(path: string) {
  if (!existsSync(path)) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, EMPTY_STATE, 'utf-8');
  }
}

export default async function globalSetup() {
  ensureFile('playwright/.auth/user.json');
  ensureFile('playwright/.auth/receiver.json');
  ensureFile('playwright/.state/journey.json');
}
