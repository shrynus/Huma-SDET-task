import { test as base } from '@playwright/test';

import { AppHeader } from '../pages/AppHeader.js';
import { AuthPage } from '../pages/AuthPage.js';
import { GamePage } from '../pages/GamePage.js';
import { HistoryPage } from '../pages/HistoryPage.js';
import { NavBar } from '../pages/NavBar.js';
import { ProfilePage } from '../pages/ProfilePage.js';
import { buildUser, seedLoggedInUser, type StoredUser } from '../utils/storage.js';

/** Seeds an account, opens the app already signed in, and returns that account. */
export type SignIn = (user?: StoredUser) => Promise<StoredUser>;

interface AppFixtures {
  header: AppHeader;
  auth: AuthPage;
  nav: NavBar;
  game: GamePage;
  profile: ProfilePage;
  history: HistoryPage;
  signIn: SignIn;
}

export const test = base.extend<AppFixtures>({
  header: async ({ page }, use) => use(new AppHeader(page)),
  auth: async ({ page }, use) => use(new AuthPage(page)),
  nav: async ({ page }, use) => use(new NavBar(page)),
  game: async ({ page }, use) => use(new GamePage(page)),
  profile: async ({ page }, use) => use(new ProfilePage(page)),
  history: async ({ page }, use) => use(new HistoryPage(page)),

  signIn: async ({ page }, use) => {
    await use(async (user = buildUser('Sara')) => {
      await seedLoggedInUser(page, user);
      await page.goto('/');
      return user;
    });
  },
});

export { expect } from '@playwright/test';
