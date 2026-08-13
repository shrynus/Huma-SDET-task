import { expect, test } from '../fixtures/app.js';
import { buildUser, readSession, readUser, seedStorage, userKey } from '../utils/storage.js';

test.describe('Authentication', () => {
  test.beforeEach(async ({ auth }) => {
    await auth.goto();
  });

  test('registers a new account and lands on the game @smoke @critical', async ({
    auth,
    nav,
    game,
    page,
  }) => {
    await auth.register('Sara');

    await expect(nav.greeting).toHaveText('Hello, Sara');
    await expect(nav.avatar).toHaveText('S');
    await expect(game.board).toBeVisible();
    expect(await readSession(page)).toBe('Sara');
    expect(await readUser(page, 'Sara')).toMatchObject({ name: 'Sara', history: [] });
  });

  test('rejects a blank name @critical', async ({ auth }) => {
    await auth.nameInput.fill('   ');
    await auth.registerButton.click();

    await expect(auth.error).toHaveText('Please enter a name.');
    await expect(auth.title).toBeVisible();
  });

  test('rejects a name that is already registered @critical', async ({ auth, page }) => {
    await seedStorage(page, { users: { [userKey('Sara')]: buildUser('Sara') } });
    await page.goto('/');

    await auth.register('Sara');

    await expect(auth.error).toHaveText('This name is already taken. Try logging in.');
  });

  test('rejects logging in with an unknown name @critical', async ({ auth }) => {
    await auth.login('Ghost');

    await expect(auth.error).toHaveText('No account with this name. Please register.');
  });

  test('logs in an existing account @smoke @critical', async ({ auth, nav, page }) => {
    await seedStorage(page, { users: { [userKey('Sara')]: buildUser('Sara') } });
    await page.goto('/');

    await auth.login('Sara');

    await expect(nav.greeting).toHaveText('Hello, Sara');
    expect(await readSession(page)).toBe('Sara');
  });

  test('matches the account regardless of surrounding spaces and letter case', async ({
    auth,
    nav,
    page,
  }) => {
    await seedStorage(page, { users: { [userKey('Sara')]: buildUser('Sara') } });
    await page.goto('/');

    await auth.login('   sArA   ');

    await expect(nav.greeting).toHaveText('Hello, Sara');
  });

  test('switches between register and log in modes', async ({ auth }) => {
    await expect(auth.registerButton).toBeVisible();

    await auth.switchToLogin();
    await expect(auth.loginButton).toBeVisible();
    await expect(auth.registerButton).toHaveCount(0);

    await auth.switchModeButton.click();
    await expect(auth.registerButton).toBeVisible();
  });

  test('logging out clears the session and returns to the auth screen @critical', async ({
    nav,
    auth,
    signIn,
    page,
  }) => {
    await signIn();

    await nav.logout();

    await expect(auth.form).toBeVisible();
    await expect(nav.root).toHaveCount(0);
    expect(await readSession(page)).toBeNull();
  });

  test('keeps the user signed in across a page reload @critical', async ({
    nav,
    signIn,
    page,
  }) => {
    await signIn(buildUser('Sara'));

    await page.reload();

    await expect(nav.greeting).toHaveText('Hello, Sara');
  });

  test('escapes HTML in the stored name instead of rendering it', async ({ auth, nav }) => {
    await auth.register('<img src=x onerror="window.__xss=1">');

    await expect(nav.greeting).toContainText('<img src=x onerror="window.__xss=1">');
    await expect(nav.greeting.locator('img')).toHaveCount(0);
  });
});
