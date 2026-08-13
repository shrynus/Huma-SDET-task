import { expect, type Locator, type Page } from '@playwright/test';

import {
  chooseSensibleMove,
  type Board,
  type CellIndex,
  type Mark,
} from '../utils/board.js';
import type { Difficulty } from '../utils/storage.js';

/** The values the app exposes through `data-status` on the status pill. */
export type GameStatus = 'your-turn' | 'computer-thinking' | 'human' | 'computer' | 'draw';

const FINISHED: readonly GameStatus[] = ['human', 'computer', 'draw'];

/** What the controls looked like at the moment the computer started thinking. */
export interface ComputerTurnLock {
  enabledCells: number;
  hintDisabled: boolean;
}

declare global {
  interface Window {
    __computerTurnLock?: ComputerTurnLock | null;
  }
}

export class GamePage {
  readonly view: Locator;
  readonly status: Locator;
  readonly board: Locator;
  readonly cells: Locator;
  readonly difficulty: Locator;
  readonly newGameButton: Locator;
  readonly hintButton: Locator;
  readonly resetButton: Locator;

  constructor(private readonly page: Page) {
    this.view = page.getByTestId('view-play');
    this.status = page.getByTestId('status');
    this.board = page.getByTestId('board');
    this.cells = page.locator('[data-testid^="cell-"]');
    this.difficulty = page.getByTestId('select-difficulty');
    this.newGameButton = page.getByTestId('btn-new');
    this.hintButton = page.getByTestId('btn-hint');
    this.resetButton = page.getByTestId('btn-reset');
  }

  cell(index: CellIndex): Locator {
    return this.page.getByTestId(`cell-${index}`);
  }

  async readBoard(): Promise<Board> {
    return this.cells.evaluateAll((nodes) =>
      nodes.map((node) => ((node as HTMLElement).dataset.state ?? 'empty') as Mark),
    );
  }

  async readStatus(): Promise<GameStatus> {
    return (await this.status.getAttribute('data-status')) as GameStatus;
  }

  /**
   * Every interaction settles on an observable state rather than a timeout:
   * the computer's reply is done exactly when the status pill stops saying
   * "computer-thinking".
   */
  async waitUntilSettled(): Promise<void> {
    await expect(this.status).not.toHaveAttribute('data-status', 'computer-thinking');
  }

  async play(index: CellIndex): Promise<void> {
    await this.cell(index).click();
    await this.waitUntilSettled();
  }

  async playMoves(indexes: readonly CellIndex[]): Promise<void> {
    for (const index of indexes) await this.play(index);
  }

  /** Plays sensibly until somebody wins or the board fills up. */
  async playUntilFinished(): Promise<GameStatus> {
    for (let move = 0; move < 9; move += 1) {
      if (FINISHED.includes(await this.readStatus())) break;
      await this.play(chooseSensibleMove(await this.readBoard()));
    }
    return this.readStatus();
  }

  async setDifficulty(difficulty: Difficulty): Promise<void> {
    await this.difficulty.selectOption(difficulty);
  }

  async startNewGame(): Promise<void> {
    await this.newGameButton.click();
    await this.waitUntilSettled();
  }

  async reset(): Promise<void> {
    await this.resetButton.click();
    await this.waitUntilSettled();
  }

  async requestHint(): Promise<void> {
    await this.hintButton.click();
  }

  /** Indexes of cells currently carrying the hint highlight. */
  async hintedCells(): Promise<number[]> {
    return this.page
      .locator('.cell.is-hint')
      .evaluateAll((nodes) =>
        nodes.map((node) => Number((node as HTMLElement).dataset.testid?.split('-')[1])),
      );
  }

  /** Indexes of cells highlighted as the winning line. */
  async winningCells(): Promise<number[]> {
    return this.page
      .locator('.cell.is-win')
      .evaluateAll((nodes) =>
        nodes.map((node) => Number((node as HTMLElement).dataset.testid?.split('-')[1])),
      );
  }

  /**
   * Arms an in-page watcher that records the state of the controls on the first
   * animation frame where the status pill reads "computer thinking".
   *
   * Asserting from the test side after the click would be a race: the reply can
   * land before the assertion is issued. Sampling inside the page cannot miss
   * the phase, and it needs no sleep.
   */
  async watchComputerTurnLock(): Promise<void> {
    await this.page.evaluate(() => {
      window.__computerTurnLock = null;

      const sample = () => {
        const status = document.querySelector<HTMLElement>('[data-testid="status"]');
        if (status?.dataset.status === 'computer-thinking') {
          const cells = document.querySelectorAll<HTMLButtonElement>('[data-testid^="cell-"]');
          const hint = document.querySelector<HTMLButtonElement>('[data-testid="btn-hint"]');
          window.__computerTurnLock = {
            enabledCells: Array.from(cells).filter((cell) => !cell.disabled).length,
            hintDisabled: hint?.disabled ?? false,
          };
          return;
        }
        requestAnimationFrame(sample);
      };

      requestAnimationFrame(sample);
    });
  }

  async readComputerTurnLock(): Promise<ComputerTurnLock | null> {
    return this.page.evaluate(() => window.__computerTurnLock ?? null);
  }

  async isBoardLocked(): Promise<boolean> {
    const enabled = await this.cells.evaluateAll((nodes) =>
      nodes.filter((node) => !(node as HTMLButtonElement).disabled).length,
    );
    return enabled === 0;
  }
}
