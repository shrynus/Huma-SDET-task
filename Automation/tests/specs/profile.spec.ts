import { expect, test } from '../fixtures/app.js';
import {
  buildHistory,
  buildUser,
  readSession,
  readUser,
  readUsers,
  seedStorage,
  userKey,
} from '../utils/storage.js';

const HISTORY = buildHistory([
  { difficulty: 'easy', result: 'win' },
  { difficulty: 'hard', result: 'loss' },
  { difficulty: 'hard', result: 'loss' },
  { difficulty: 'medium', result: 'draw' },
]);

test.describe('Profile', () => {
  test.beforeEach(async ({ signIn, nav }) => {
    await signIn(buildUser('Sara', { history: HISTORY }));
    await nav.openProfile();
  });

  test('shows the stored name and the tally of results @smoke @critical', async ({ profile }) => {
    await expect(profile.nameInput).toHaveValue('Sara');
    expect(await profile.readStats()).toEqual({ wins: 1, losses: 2, draws: 1 });
  });

  test('renames the account and keeps its history @critical', async ({ profile, nav, page }) => {
    await profile.rename('Sara Connor');

    await expect(profile.message).toHaveText('Saved.');
    await expect(nav.greeting).toHaveText('Hello, Sara Connor');
    expect(await readSession(page)).toBe('Sara Connor');
    expect(await readUser(page, 'Sara Connor')).toMatchObject({
      name: 'Sara Connor',
      history: HISTORY,
    });
    expect(Object.keys(await readUsers(page))).toEqual([userKey('Sara Connor')]);
  });

  test('rejects a blank name @critical', async ({ profile, nav }) => {
    await profile.rename('   ');

    await expect(profile.error).toHaveText('Please enter a name.');
    await expect(nav.greeting).toHaveText('Hello, Sara');
  });

  test('rejects a name taken by another account @critical', async ({ profile, nav, page }) => {
    await seedStorage(page, {
      users: { [userKey('Sara')]: buildUser('Sara'), [userKey('Kyle')]: buildUser('Kyle') },
      session: 'Sara',
    });
    await page.goto('/');
    await nav.openProfile();

    await profile.rename('kyle');

    await expect(profile.error).toHaveText('Another account already uses this name.');
    expect(await readUser(page, 'Kyle')).toMatchObject({ name: 'Kyle' });
  });

  test('asks for confirmation before deleting the account and honours a cancel @critical', async ({
    profile,
    nav,
    page,
  }) => {
    const message = await profile.deleteAccount({ confirm: false });

    expect(message).toBe('Delete this account and all its data? This cannot be undone.');
    await expect(nav.greeting).toHaveText('Hello, Sara');
    expect(await readUser(page, 'Sara')).toBeDefined();
  });

  test('deletes the account and signs the user out on confirm @critical', async ({
    profile,
    auth,
    page,
  }) => {
    await profile.deleteAccount({ confirm: true });

    await expect(auth.form).toBeVisible();
    expect(await readUser(page, 'Sara')).toBeUndefined();
    expect(await readSession(page)).toBeNull();
  });
});
