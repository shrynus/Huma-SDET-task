import type { GamePage, GameStatus } from '../pages/GamePage.js';

/**
 * The computer's move selection is not deterministic on Easy/Medium, so a spec
 * that needs a specific outcome (a human win, a draw) replays sensible games
 * until it gets one.
 *
 * Bounded and explicit: the spec fails loudly rather than silently passing if
 * the outcome never occurs.
 */
export async function playUntilOutcome(
  game: GamePage,
  target: GameStatus,
  maxAttempts = 8,
): Promise<number> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    await game.startNewGame();
    if ((await game.playUntilFinished()) === target) return attempt;
  }
  throw new Error(`Outcome "${target}" did not occur within ${maxAttempts} games.`);
}
