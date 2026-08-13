import type { Locator, Page } from '@playwright/test';

import { handleConfirm } from './dialogs.js';

export interface ProfileStats {
  wins: number;
  losses: number;
  draws: number;
}

export class ProfilePage {
  readonly view: Locator;
  readonly title: Locator;
  readonly nameInput: Locator;
  readonly saveButton: Locator;
  readonly message: Locator;
  readonly error: Locator;
  readonly createdAt: Locator;
  readonly wins: Locator;
  readonly losses: Locator;
  readonly draws: Locator;
  readonly deleteAccountButton: Locator;

  constructor(private readonly page: Page) {
    this.view = page.getByTestId('view-profile');
    this.title = page.getByTestId('profile-title');
    this.nameInput = page.getByTestId('input-profile-name');
    this.saveButton = page.getByTestId('btn-save-profile');
    this.message = page.getByTestId('profile-message');
    this.error = page.getByTestId('profile-error');
    this.createdAt = page.getByTestId('profile-created');
    this.wins = page.getByTestId('profile-wins');
    this.losses = page.getByTestId('profile-losses');
    this.draws = page.getByTestId('profile-draws');
    this.deleteAccountButton = page.getByTestId('btn-delete-account');
  }

  async rename(name: string): Promise<void> {
    await this.nameInput.fill(name);
    await this.saveButton.click();
  }

  async readStats(): Promise<ProfileStats> {
    const [wins, losses, draws] = await Promise.all([
      this.wins.innerText(),
      this.losses.innerText(),
      this.draws.innerText(),
    ]);
    return { wins: Number(wins), losses: Number(losses), draws: Number(draws) };
  }

  /**
   * Account deletion is guarded by a native `confirm()` dialog.
   * Returns the dialog text so specs can assert the user was warned.
   */
  async deleteAccount(options: { confirm: boolean }): Promise<string> {
    return handleConfirm(this.page, this.deleteAccountButton, options.confirm);
  }
}
