import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 4173);
export const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './tests/specs',
  outputDir: './test-results',
  fullyParallel: true,

  // A green suite must stay green: no accidental `test.only` in CI.
  forbidOnly: !!process.env.CI,

  /**
   * Zero retries on purpose.
   *
   * The suite is deterministic by design (see docs/TEST_PLAN.md § Flakiness
   * strategy): every wait is tied to an observable application state, never to
   * a fixed timeout. Retries would hide exactly the kind of race condition this
   * SUT is most likely to regress on.
   */
  retries: 0,
  workers: process.env.CI ? 2 : undefined,

  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['list']]
    : [['html', { open: 'never' }], ['list']],

  /**
   * Generous, because several specs deliberately replay whole games. Individual
   * assertions stay tight, so a genuine hang still fails quickly.
   */
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    // Traces carry screenshots and DOM snapshots and are far cheaper to record
    // than video across three engines at once; video is opt-in via CLI.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',

    /**
     * Sized for a loaded CI runner rather than a quiet laptop. These bound how
     * long an element may take to become actionable — they are not a substitute
     * for waiting on state, which every page object still does. A genuinely
     * stuck UI fails well inside the 60 s test timeout.
     */
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    testIdAttribute: 'data-testid',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  webServer: {
    command: 'node tools/static-server.mjs',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
