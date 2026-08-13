import { expect, test } from '../fixtures/app.js';
import { buildUser } from '../utils/storage.js';

test.describe('Accessibility basics', () => {
  test.beforeEach(async ({ signIn }) => {
    await signIn(buildUser('Sara', { difficulty: 'easy' }));
  });

  test('exposes the board as a grid of labelled cells @critical', async ({ game }) => {
    await expect(game.board).toHaveAttribute('role', 'grid');
    await expect(game.board).toHaveAttribute('aria-label', 'Tic-Tac-Toe board');
    await expect(game.cell(0)).toHaveAttribute('role', 'gridcell');
    await expect(game.cell(0)).toHaveAttribute('aria-label', 'row 1, column 1, empty');
    await expect(game.cell(8)).toHaveAttribute('aria-label', 'row 3, column 3, empty');
  });

  test('updates the cell label once it is played', async ({ game }) => {
    await game.play(0);

    await expect(game.cell(0)).toHaveAttribute('aria-label', /row 1, column 1, X/i);
  });

  test('announces status changes through a live region @critical', async ({ game }) => {
    await expect(game.status).toHaveAttribute('role', 'status');
    await expect(game.status).toHaveAttribute('aria-live', 'polite');
  });

  test('accepts a move from the keyboard @critical', async ({ game }) => {
    await game.cell(4).press('Enter');
    await game.waitUntilSettled();

    expect((await game.readBoard())[4]).toBe('x');
  });

  test('reaches the board by tabbing from the difficulty selector', async ({ game, page }) => {
    await game.difficulty.focus();
    await page.keyboard.press('Tab');

    await expect(game.cell(0)).toBeFocused();
  });
});
