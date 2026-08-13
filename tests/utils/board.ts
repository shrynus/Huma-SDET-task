/**
 * Pure tic-tac-toe domain helpers.
 *
 * Kept free of Playwright imports on purpose: the rules of the game are not a
 * UI concern, and specs read better when they can talk about "a winning line"
 * instead of "the third locator in the grid".
 */

export type Mark = 'x' | 'o' | 'empty';
export type Board = readonly Mark[];

export const CELL_COUNT = 9;
export const CELL_INDEXES = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
export type CellIndex = (typeof CELL_INDEXES)[number];

export const WINNING_LINES: ReadonlyArray<readonly [CellIndex, CellIndex, CellIndex]> = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function countMark(board: Board, mark: Mark): number {
  return board.filter((cell) => cell === mark).length;
}

export function emptyCells(board: Board): CellIndex[] {
  return CELL_INDEXES.filter((index) => board[index] === 'empty');
}

/**
 * X always moves first, so at any point between turns the board must hold
 * either an equal number of marks, or exactly one more X than O.
 *
 * A violation means a mark was destroyed or created out of turn — the single
 * most valuable integrity assertion available for this SUT.
 */
export function isTurnOrderValid(board: Board): boolean {
  const x = countMark(board, 'x');
  const o = countMark(board, 'o');
  return x === o || x === o + 1;
}

export function winningLineFor(board: Board, mark: Mark): readonly CellIndex[] | null {
  return WINNING_LINES.find((line) => line.every((index) => board[index] === mark)) ?? null;
}

/** The cell that completes a line for `mark`, i.e. an immediate win or an immediate block. */
export function findCompletingMove(board: Board, mark: Mark): CellIndex | null {
  for (const line of WINNING_LINES) {
    const marks = line.map((index) => board[index]);
    const owned = marks.filter((cell) => cell === mark).length;
    const emptyAt = marks.indexOf('empty');
    if (owned === 2 && emptyAt !== -1) return line[emptyAt] as CellIndex;
  }
  return null;
}

/**
 * A deliberately simple opponent used to drive games to completion:
 * win if possible, otherwise block, otherwise take the best free square.
 */
export function chooseSensibleMove(board: Board): CellIndex {
  const win = findCompletingMove(board, 'x');
  if (win !== null) return win;

  const block = findCompletingMove(board, 'o');
  if (block !== null) return block;

  const preference: CellIndex[] = [4, 0, 2, 6, 8, 1, 3, 5, 7];
  const move = preference.find((index) => board[index] === 'empty');
  if (move === undefined) throw new Error(`No free cell on board: ${format(board)}`);
  return move;
}

/** Compact, log-friendly rendering: `x.o|..x|o..` */
export function format(board: Board): string {
  const symbol = (cell: Mark | undefined) => (cell === 'empty' || cell === undefined ? '.' : cell);
  return [0, 3, 6].map((row) => board.slice(row, row + 3).map(symbol).join('')).join('|');
}
