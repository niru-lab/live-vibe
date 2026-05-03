/**
 * FEYRN — Global Test Setup
 *
 * 1. Ruft die Edge Function `test-seed-users` mit Service-Secret auf.
 * 2. Function legt User idempotent in auth.users + profiles an
 *    (email_confirm=true, onboarding_complete=true).
 * 3. Function gibt access/refresh Token zurück → wir bauen daraus
 *    das Supabase-localStorage-Format und speichern es als Playwright
 *    storageState. Tests starten direkt eingeloggt.
 *
 * Idempotent: kann beliebig oft laufen, ohne Duplikate zu erzeugen.
 */

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.test' });
loadEnv({ path: '.env' }); // Fallback für VITE_*

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ??
  'https://advxucizvsqeipznabyu.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
const SEED_SECRET = process.env.TEST_SEED_SECRET;

const PROJECT_REF = new URL(SUPABASE_URL).host.split('.')[0];
const STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`;

export const TEST_USERS = {
  sender: {
    role: 'sender' as const,
    file: 'playwright/.auth/user.json',
    email: process.env.FEYRN_TEST_USER_EMAIL ?? 'testuser@feyrn-test.de',
    password: process.env.FEYRN_TEST_USER_PASSWORD ?? 'TestFeyrn2026!',
    username: 'feyrn_testuser',
    displayName: 'Test User',
    age: 25,
    profileType: 'user' as const,
  },
  receiver: {
    role: 'receiver' as const,
    file: 'playwright/.auth/receiver.json',
    email: process.env.FEYRN_TEST_RECEIVER_EMAIL ?? 'receiver@feyrn-test.de',
    password: process.env.FEYRN_TEST_RECEIVER_PASSWORD ?? 'TestFeyrn2026!',
    username: 'feyrn_receiver',
    displayName: 'Test Receiver',
    age: 26,
    profileType: 'user' as const,
  },
} as const;

const TEST_USERS_LIST = [TEST_USERS.sender, TEST_USERS.receiver];

const EMPTY_STATE = JSON.stringify({ cookies: [], origins: [] });

function ensureDir(path: string) {
  mkdirSync(dirname(path), { recursive: true });
}

function writeEmpty(path: string) {
  ensureDir(path);
  if (!existsSync(path)) writeFileSync(path, EMPTY_STATE, 'utf-8');
}

function buildStorageState(opts: {
  origin: string;
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
}) {
  const session = {
    access_token: opts.accessToken,
    refresh_token: opts.refreshToken,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: opts.userId, email: opts.email },
  };

  return {
    cookies: [],
    origins: [
      {
        origin: opts.origin,
        localStorage: [
          { name: STORAGE_KEY, value: JSON.stringify(session) },
        ],
      },
    ],
  };
}

export default async function globalSetup() {
  // Always ensure journey state file exists
  writeEmpty('playwright/.state/journey.json');

  // If secret/keys are missing (e.g. local dev without .env.test), fall back
  // to empty storage states so Playwright still boots. Auth tests will then
  // exercise the UI flow themselves.
  if (!SEED_SECRET || !SUPABASE_ANON_KEY) {
    console.warn(
      '⚠️  TEST_SEED_SECRET or SUPABASE anon key missing — skipping backend seed. ' +
        'Auth-dependent tests will fail until .env.test is configured.',
    );
    for (const u of TEST_USERS) writeEmpty(u.file);
    return;
  }

  const baseUrl = process.env.FEYRN_BASE_URL ?? 'http://localhost:8080';

  console.log('🌱 Seeding test users via edge function…');
  const res = await fetch(`${SUPABASE_URL}/functions/v1/test-seed-users`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-seed-secret': SEED_SECRET,
      apikey: SUPABASE_ANON_KEY,
      authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      users: TEST_USERS.map(({ email, password, username, displayName, age, profileType }) => ({
        email,
        password,
        username,
        displayName,
        age,
        profileType,
      })),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`test-seed-users failed (${res.status}): ${text}`);
  }

  const { users } = (await res.json()) as {
    users: Array<{
      email: string;
      userId: string;
      accessToken: string;
      refreshToken: string;
    }>;
  };

  for (const u of TEST_USERS) {
    const seeded = users.find((x) => x.email.toLowerCase() === u.email.toLowerCase());
    if (!seeded) throw new Error(`Seed response missing user: ${u.email}`);

    const state = buildStorageState({
      origin: baseUrl,
      accessToken: seeded.accessToken,
      refreshToken: seeded.refreshToken,
      userId: seeded.userId,
      email: seeded.email,
    });

    ensureDir(u.file);
    writeFileSync(u.file, JSON.stringify(state, null, 2), 'utf-8');
    console.log(`✅ ${u.role} → ${u.file}`);
  }

  console.log('🌱 Seed complete.\n');
}
