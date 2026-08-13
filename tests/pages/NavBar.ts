import type { Locator, Page } from '@playwright/test';

/** Signed-in navigation bar, present on every authenticated view. */
export class NavBar {
  readonly root: Locator;
  readonly avatar: Locator;
  readonly greeting: Locator;
  readonly playLink: Locator;
  readonly profileLink: Locator;
  readonly historyLink: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.root = page.getByTestId('nav');
    this.avatar = page.getByTestId('avatar');
    this.greeting = page.getByTestId('hello-user');
    this.playLink = page.getByTestId('nav-play');
    this.profileLink = page.getByTestId('nav-profile');
    this.historyLink = page.getByTestId('nav-history');
    this.logoutButton = page.getByTestId('btn-logout');
  }

  async openPlay(): Promise<void> {
    await this.playLink.click();
  }

  async openProfile(): Promise<void> {
    await this.profileLink.click();
  }

  async openHistory(): Promise<void> {
    await this.historyLink.click();
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }
}
