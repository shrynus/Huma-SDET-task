import { expect, test } from '../fixtures/app.js';
import { playUntilOutcome } from '../utils/outcomes.js';
import { buildHistory, buildUser, readUser } from '../utils/storage.js';

const HISTORY = buildHistory([
  { difficulty: 'hard', result: 'loss' },
  { difficulty: 'medium', result: 'draw' },
  { difficulty: 'easy', result: 'win' },
]);

test.describe('Game history', () => {
  test('shows an empty state and hides the clear action for a new account @critical', async ({
    signIn,
    nav,
    history,
  }) => {
    await signIn(buildUser('Sara'));
    await nav.openHistory();

    await expect(history.emptyState).toHaveText('No games yet. Play one!');
    await expect(history.rows).toHaveCount(0);
    await expect(history.clearButton).toHaveCount(0);
  });

  test('lists finished games newest first @smoke @critical', async ({ signIn, nav, history }) => {
    await signIn(buildUser('Sara', { history: HISTORY }));
    await nav.openHistory();

    await expect(history.rows).toHaveCount(3);
    expect(await history.readRow(0)).toMatchObject({ difficulty: 'Hard', result: 'Loss' });
    expect(await history.readRow(1)).toMatchObject({ difficulty: 'Medium', result: 'Draw' });
    expect(await history.readRow(2)).toMatchObject({ difficulty: 'Easy', result: 'Win' });
  });

  test('marks each row with its result for styling and assertions', async ({
    signIn,
    nav,
    history,
  }) => {
    await signIn(buildUser('Sara', { history: HISTORY }));
    await nav.openHistory();

    await expect(history.row(0)).toHaveAttribute('data-result', 'loss');
    await expect(history.row(1)).toHaveAttribute('data-result', 'draw');
    await expect(history.row(2)).toHaveAttribute('data-result', 'win');
  });

  test('adds a row as soon as a game finishes @critical', async ({ signIn, nav, game, history }) => {
    test.setTimeout(120_000);
    await signIn(buildUser('Sara', { difficulty: 'easy' }));
    await playUntilOutcome(game, 'human');

    await nav.openHistory();

    await expect(history.rows).toHaveCount(1);
    expect(await history.readRow(0)).toMatchObject({ difficulty: 'Easy', result: 'Win' });
  });

  test('keeps the history when the clear dialog is cancelled @critical', async ({
    signIn,
    nav,
    history,
  }) => {
    await signIn(buildUser('Sara', { history: HISTORY }));
    await nav.openHistory();

    const message = await history.clearHistory({ confirm: false });

    expect(message).toBe('Clear all game history?');
    await expect(history.rows).toHaveCount(3);
  });

  test('clears the history on confirm @critical', async ({ signIn, nav, history, page }) => {
    await signIn(buildUser('Sara', { history: HISTORY }));
    await nav.openHistory();

    await history.clearHistory({ confirm: true });

    await expect(history.emptyState).toBeVisible();
    await expect(history.rows).toHaveCount(0);
    expect((await readUser(page, 'Sara'))?.history).toEqual([]);
  });

  test('resets the profile tally together with the history', async ({
    signIn,
    nav,
    history,
    profile,
  }) => {
    await signIn(buildUser('Sara', { history: HISTORY }));
    await nav.openHistory();
    await history.clearHistory({ confirm: true });

    await nav.openProfile();

    expect(await profile.readStats()).toEqual({ wins: 0, losses: 0, draws: 0 });
  });
});
