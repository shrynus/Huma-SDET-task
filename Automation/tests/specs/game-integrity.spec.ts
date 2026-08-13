import { expect, test } from '../fixtures/app.js';
import {
  chooseSensibleMove,
  format,
  isTurnOrderValid,
  type Board,
  type CellIndex,
} from '../utils/board.js';
import { buildUser, type Difficulty } from '../utils/storage.js';

/**
 * Board integrity — the rules that must hold no matter which move is played.
 *
 * The two `@known-issue` tests below fail against the current build. That is
 * deliberate: they encode the correct behaviour and document a real defect.
 * See Manual/BUG_REPORTS.xlsx → BUG-001.
 */
test.describe('Board integrity', () => {
  test.beforeEach(async ({ signIn }) => {
    await signIn(buildUser('Sara', { difficulty: 'hard' }));
  });

  test('the computer never plays a cell the human already took @critical @known-issue', async ({
    game,
  }) => {
    // On Hard the computer reuses the reply it picked in the first game of the
    // page session, whatever the human plays afterwards. Probing for that cell
    // and then taking it first reproduces the defect deterministically, without
    // hard-coding a cell index that only holds for one build.
    await game.startNewGame();
    await game.play(0);
    const probe = await game.readBoard();
    const contested = probe.findIndex((cell) => cell === 'o') as CellIndex;
    expect(contested, `computer did not move: ${format(probe)}`).toBeGreaterThanOrEqual(0);

    await game.startNewGame();
    await game.play(contested);

    const board = await game.readBoard();
    expect(board[contested], `X on cell ${contested} was overwritten: ${format(board)}`).toBe('x');
  });

  test('the board keeps a valid turn order for a whole game @critical @known-issue', async ({
    game,
  }) => {
    const snapshots: Board[] = [];

    for (let move = 0; move < 9; move += 1) {
      const before = await game.readBoard();
      if (!before.includes('empty')) break;
      if (['human', 'computer', 'draw'].includes(await game.readStatus())) break;

      await game.play(chooseSensibleMove(before));
      snapshots.push(await game.readBoard());
    }

    const invalid = snapshots.find((board) => !isTurnOrderValid(board));
    expect(invalid ? format(invalid) : null, 'X must never be outnumbered by O').toBeNull();
  });

  // Control tests: the same scenario is healthy on the other two levels, which
  // scopes the defect to the Hard opponent rather than to move handling itself.
  for (const difficulty of ['easy', 'medium'] as Difficulty[]) {
    test(`the computer never overwrites the human's opening move on ${difficulty}`, async ({
      game,
    }) => {
      await game.setDifficulty(difficulty);

      for (const cell of [0, 1, 2, 3, 4, 5, 6, 7, 8] as CellIndex[]) {
        await game.startNewGame();
        await game.play(cell);

        const board = await game.readBoard();
        expect(board[cell], `opening on ${cell} produced ${format(board)}`).toBe('x');
      }
    });
  }
});
