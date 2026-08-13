import { expect, test } from '../fixtures/app.js';
import { chooseSensibleMove, format, type CellIndex } from '../utils/board.js';
import { buildUser } from '../utils/storage.js';

test.describe('Hint', () => {
  test.beforeEach(async ({ signIn }) => {
    await signIn(buildUser('Sara', { difficulty: 'easy' }));
  });

  test('highlights exactly one cell @smoke', async ({ game }) => {
    await game.requestHint();

    expect(await game.hintedCells()).toHaveLength(1);
  });

  test('clears the highlight once a move is played', async ({ game }) => {
    await game.requestHint();
    const [suggested] = await game.hintedCells();

    await game.play(suggested as CellIndex);

    expect(await game.hintedCells()).toHaveLength(0);
  });

  test('is unavailable while the computer is thinking', async ({ game }) => {
    await game.watchComputerTurnLock();

    await game.cell(0).click();
    await game.waitUntilSettled();

    expect((await game.readComputerTurnLock())?.hintDisabled).toBe(true);
  });

  test('is unavailable once the game is over', async ({ game }) => {
    test.setTimeout(60_000);
    await game.playUntilFinished();

    await expect(game.hintButton).toBeDisabled();
  });

  /**
   * Fails against the current build: from the second turn onwards the hint can
   * point at a square that is already taken, which the player cannot play.
   * See Manual/BUG_REPORTS.xlsx → BUG-002.
   *
   * The defect is intermittent — roughly one hint in three — so a single turn
   * is not enough evidence either way. Sampling every turn of four games gives
   * ~14 hints, which makes a false pass unlikely (~1 %) while keeping the test
   * bounded and fast.
   */
  test('only ever suggests a free cell @critical @known-issue', async ({ game }) => {
    test.setTimeout(60_000);

    for (let round = 0; round < 4; round += 1) {
      await game.startNewGame();

      for (let move = 0; move < 9; move += 1) {
        const board = await game.readBoard();
        if (!board.includes('empty')) break;
        if (['human', 'computer', 'draw'].includes(await game.readStatus())) break;

        await game.requestHint();
        const [suggested] = await game.hintedCells();

        expect(
          board[suggested as number],
          `hint pointed at cell ${suggested}, which is not free, on board ${format(board)}`,
        ).toBe('empty');

        await game.play(chooseSensibleMove(board));
      }
    }
  });
});
