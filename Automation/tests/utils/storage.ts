/**
 * The SUT keeps all of its state in localStorage. Reading and seeding it
 * directly lets tests start from an exact precondition (e.g. "a user with 3
 * losses on Hard") without clicking through unrelated screens first.
 */
import type { Page } from '@playwright/test';

export const STORAGE_KEYS = {
  users: 'ttt:users',
  session: 'ttt:session',
  theme: 'ttt:theme',
  language: 'ttt:lang',
} as const;

export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameResult = 'win' | 'loss' | 'draw';

export interface GameRecord {
  finishedAt: number;
  difficulty: Difficulty;
  result: GameResult;
}

export interface StoredUser {
  name: string;
  createdAt: number;
  difficulty: Difficulty;
  history: GameRecord[];
}

export type UserStore = Record<string, StoredUser>;

/** The app keys users by their lower-cased name. */
export function userKey(name: string): string {
  return name.trim().toLowerCase();
}

export function buildUser(name: string, overrides: Partial<StoredUser> = {}): StoredUser {
  return {
    name,
    createdAt: Date.now(),
    difficulty: 'easy',
    history: [],
    ...overrides,
  };
}

export function buildHistory(entries: ReadonlyArray<Omit<GameRecord, 'finishedAt'>>): GameRecord[] {
  // Newest first, one minute apart, which is how the app renders them.
  const now = Date.now();
  return entries.map((entry, position) => ({ ...entry, finishedAt: now - position * 60_000 }));
}

/**
 * Each `seedStorage` call gets its own marker, so it applies exactly once — on
 * the next navigation — and never again. A test may therefore re-seed a
 * different precondition mid-test without the earlier seed fighting it.
 */
let seedCounter = 0;

/**
 * Seeds storage *before* any application script runs, so the app boots straight
 * into the desired state instead of re-rendering into it.
 *
 * The seed is applied only on the first document of the context. `addInitScript`
 * runs on every navigation, and re-seeding on `page.reload()` would silently
 * undo whatever the test had changed — which is precisely what persistence
 * tests are there to verify.
 */
export async function seedStorage(
  page: Page,
  state: { users?: UserStore; session?: string; theme?: 'light' | 'dark'; language?: 'en' | 'fa' },
): Promise<void> {
  seedCounter += 1;
  const flagKey = `__seeded_${seedCounter}__`;

  await page.addInitScript(
    ([keys, seed, flag]) => {
      if (window.sessionStorage.getItem(flag as string)) return;
      window.sessionStorage.setItem(flag as string, '1');

      const { users, session, theme, language } = seed as {
        users?: unknown;
        session?: string;
        theme?: string;
        language?: string;
      };
      const storageKeys = keys as Record<string, string>;

      window.localStorage.clear();
      if (users) window.localStorage.setItem(storageKeys.users!, JSON.stringify(users));
      if (session) window.localStorage.setItem(storageKeys.session!, session);
      if (theme) window.localStorage.setItem(storageKeys.theme!, theme);
      if (language) window.localStorage.setItem(storageKeys.language!, language);
    },
    [STORAGE_KEYS, state, flagKey] as const,
  );
}

/** Seeds a single logged-in user — by far the most common precondition. */
export async function seedLoggedInUser(page: Page, user: StoredUser): Promise<void> {
  await seedStorage(page, { users: { [userKey(user.name)]: user }, session: user.name });
}

export async function readUsers(page: Page): Promise<UserStore> {
  const raw = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEYS.users);
  return raw ? (JSON.parse(raw) as UserStore) : {};
}

export async function readUser(page: Page, name: string): Promise<StoredUser | undefined> {
  return (await readUsers(page))[userKey(name)];
}

export async function readSession(page: Page): Promise<string | null> {
  return page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEYS.session);
}
