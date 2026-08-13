import { expect, test } from '../fixtures/app.js';
import { buildHistory, buildUser } from '../utils/storage.js';

test.describe('Language and theme', () => {
  test.beforeEach(async ({ signIn }) => {
    await signIn(buildUser('Sara', { history: buildHistory([{ difficulty: 'easy', result: 'win' }]) }));
  });

  test('toggles between light and dark and remembers the choice @critical', async ({
    header,
    page,
  }) => {
    expect(await header.currentTheme()).toBe('light');

    await header.toggleTheme();
    expect(await header.currentTheme()).toBe('dark');

    await page.reload();
    expect(await header.currentTheme()).toBe('dark');
  });

  test('switches the interface to Persian and flips to right-to-left @smoke @critical', async ({
    header,
    nav,
    game,
  }) => {
    await header.selectLanguage('fa');

    expect(await header.textDirection()).toBe('rtl');
    await expect(nav.playLink).toHaveText('بازی');
    await expect(game.status).toHaveText('نوبت شما (X)');
    await expect(game.difficulty.locator('option')).toHaveText(['آسان', 'متوسط', 'سخت']);
  });

  test('remembers the language across a reload @critical', async ({ header, page }) => {
    await header.selectLanguage('fa');

    await page.reload();

    await expect(header.languageSelect).toHaveValue('fa');
    expect(await header.textDirection()).toBe('rtl');
  });

  test('returns to English and left-to-right', async ({ header, nav }) => {
    await header.selectLanguage('fa');
    await header.selectLanguage('en');

    expect(await header.textDirection()).toBe('ltr');
    await expect(nav.playLink).toHaveText('Play');
  });

  test('localises the history table and its dates', async ({ header, nav, history }) => {
    await nav.openHistory();
    const english = await history.readRow(0);

    await header.selectLanguage('fa');
    const persian = await history.readRow(0);

    await expect(history.title).toHaveText('تاریخچهٔ بازی‌ها');
    expect(persian.result).toBe('برد');
    expect(persian.date).not.toBe(english.date);
    expect(persian.date).toMatch(/[۰-۹]/);
  });
});
