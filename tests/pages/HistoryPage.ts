import type { Locator, Page } from '@playwright/test';

import { handleConfirm } from './dialogs.js';

export interface HistoryRow {
  date: string;
  difficulty: string;
  result: string;
}

export class HistoryPage {
  readonly view: Locator;
  readonly title: Locator;
  readonly table: Locator;
  readonly rows: Locator;
  readonly emptyState: Locator;
  readonly clearButton: Locator;

  constructor(private readonly page: Page) {
    this.view = page.getByTestId('view-history');
    this.title = page.getByTestId('history-title');
    this.table = page.getByTestId('history-table');
    this.rows = page.locator('[data-testid^="history-row-"]');
    this.emptyState = page.getByTestId('history-empty');
    this.clearButton = page.getByTestId('btn-clear-history');
  }

  row(index: number): Locator {
    return this.page.getByTestId(`history-row-${index}`);
  }

  async readRow(index: number): Promise<HistoryRow> {
    const [date, difficulty, result] = await Promise.all([
      this.page.getByTestId(`history-date-${index}`).innerText(),
      this.page.getByTestId(`history-difficulty-${index}`).innerText(),
      this.page.getByTestId(`history-result-${index}`).innerText(),
    ]);
    return { date, difficulty, result };
  }

  /** History clearing is guarded by a native `confirm()` dialog. */
  async clearHistory(options: { confirm: boolean }): Promise<string> {
    return handleConfirm(this.page, this.clearButton, options.confirm);
  }
}
