import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/__tests__/e2e',
  fullyParallel: false, // USER JOURNEY — tests must run in order
  forbidOnly: !!process.env.CI,
  // No retries for journey tests: a retry would re-run DB mutations and pollute state.
  retries: 0,
  workers: 1,

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: process.env.FEYRN_BASE_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Simulate a real Gen-Z mobile user (iPhone 14)
    ...devices['iPhone 14'],

    // Persist auth state across tests in the same journey
    storageState: 'playwright/.auth/user.json',
  },

  // Setup: ensures auth state files exist before any project starts
  globalSetup: './playwright/global-setup.ts',

  projects: [
    // Phase 1: Auth Setup (no storageState — registers/logs in fresh)
    {
      name: 'auth-setup',
      testMatch: '**/01-auth-security.spec.ts',
      use: { storageState: undefined },
    },
    // Phase 2: Full journey (uses saved auth state from auth-setup)
    {
      name: 'user-journey',
      testMatch: '**/0[2-9]-*.spec.ts',
      dependencies: ['auth-setup'],
    },
    // Phase 3: Receiver side (separate user)
    {
      name: 'receiver-journey',
      testMatch: '**/10-receiver-*.spec.ts',
      dependencies: ['user-journey'],
      use: { storageState: 'playwright/.auth/receiver.json' },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    // Reuse the running Lovable dev server in sandbox/local; CI starts fresh.
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
