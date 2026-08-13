import { expect, test } from '../fixtures/app.js';
import { countMark, format, winningLineFor } from '../utils/board.js';
import { playUntilOutcome } from '../utils/outcomes.js';
import { buildUser, readUser } from '../utils/storage.js';

test.describe('Gameplay', () => {
  test.beforeEach(async ({ signIn }) => {
    await signIn(buildUser('Sara', { difficulty: 'easy' }));
  });

  test('starts with an empty board and the human to move @smoke @critical', async ({ game }) => {
    await expect(game.status).toHaveAttribute('data-status', 'your-turn');
    await expect(game.status).toHaveText('Your turn (X)');
    expect(countMark(await game.readBoard(), 'empty')).toBe(9);
  });

  test('places an X on the clicked cell and lets the computer answer @smoke @critical', async ({
    game,
  }) => {
    await game.play(0);

    const board = await game.readBoard();
    expect(board[0], `unexpected board: ${format(board)}`).toBe('x');
    expect(countMark(board, 'x')).toBe(1);
    expect(countMark(board, 'o')).toBe(1);
    await expect(game.status).toHaveAttribute('data-status', 'your-turn');
  });

  test('locks the board while the computer is thinking @critical', async ({ game }) => {
    await game.watchComputerTurnLock();

    await game.cell(4).click();
    await game.waitUntilSettled();

    const lock = await game.readComputerTurnLock();
    expect(lock, 'the computer-thinking phase was never observed').not.toBeNull();
    expect(lock?.enabledCells, 'no cell may be clickable during the computer turn').toBe(0);
    expect(lock?.hintDisabled).toBe(true);
  });

  test('does not allow replaying an occupied cell @critical', async ({ game }) => {
    await game.play(0);
    const before = await game.readBoard();

    await expect(game.cell(0)).toBeDisabled();
    const occupiedByComputer = before.findIndex((cell) => cell === 'o');
    await expect(game.cell(occupiedByComputer as 0)).toBeDisabled();

    expect(await game.readBoard()).toEqual(before);
  });

  test('detects a human win, highlights the line and locks the board @critical', async ({
    game,
  }) => {
    test.setTimeout(120_000);
    await playUntilOutcome(game, 'human');

    const board = await game.readBoard();
    const line = winningLineFor(board, 'x');

    await expect(game.status).toHaveText('You win!');
    expect(line, `no winning X line on ${format(board)}`).not.toBeNull();
    expect((await game.winningCells()).sort()).toEqual([...line!].sort());
    expect(await game.isBoardLocked()).toBe(true);
  });

  test('detects a draw on a full board @critical', async ({ game }) => {
    test.setTimeout(120_000);
    await game.setDifficulty('medium');
    await playUntilOutcome(game, 'draw');

    const board = await game.readBoard();

    await expect(game.status).toHaveText('Draw.');
    expect(countMark(board, 'empty')).toBe(0);
    expect(winningLineFor(board, 'x')).toBeNull();
    expect(winningLineFor(board, 'o')).toBeNull();
    expect(await game.winningCells()).toHaveLength(0);
    expect(await game.isBoardLocked()).toBe(true);
  });

  test('records the finished game in the account history @critical', async ({ game, page }) => {
    test.setTimeout(120_000);
    await playUntilOutcome(game, 'human');

    const user = await readUser(page, 'Sara');
    expect(user?.history[0]).toMatchObject({ result: 'win', difficulty: 'easy' });
  });

  test('New Game clears the board without recording an abandoned game', async ({ game, page }) => {
    await game.play(0);

    await game.startNewGame();

    expect(countMark(await game.readBoard(), 'empty')).toBe(9);
    await expect(game.status).toHaveAttribute('data-status', 'your-turn');
    expect((await readUser(page, 'Sara'))?.history).toHaveLength(0);
  });

  test('Reset clears the board without recording an abandoned game', async ({ game, page }) => {
    await game.play(4);

    await game.reset();

    expect(countMark(await game.readBoard(), 'empty')).toBe(9);
    expect((await readUser(page, 'Sara'))?.history).toHaveLength(0);
  });

  test('offers the three difficulty levels and remembers the choice @critical', async ({
    game,
    page,
  }) => {
    await expect(game.difficulty.locator('option')).toHaveText(['Easy', 'Medium', 'Hard']);

    await game.setDifficulty('hard');

    expect((await readUser(page, 'Sara'))?.difficulty).toBe('hard');
    await page.reload();
    await expect(game.difficulty).toHaveValue('hard');
  });

  test('keeps the difficulty fixed once a game is in progress', async ({ game }) => {
    await game.play(0);

    await game.setDifficulty('hard');

    await expect(game.difficulty).toHaveValue('easy');
  });

  test('does not restore an unfinished game after a reload', async ({ game, page }) => {
    await game.play(0);

    await page.reload();

    expect(countMark(await game.readBoard(), 'empty')).toBe(9);
    await expect(game.status).toHaveAttribute('data-status', 'your-turn');
  });
});
