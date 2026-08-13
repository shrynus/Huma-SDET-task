import type { Locator, Page } from '@playwright/test';

/**
 * Register / log in screen. The SUT has no password: the name alone identifies
 * the account, and the same form is reused for both modes.
 */
export class AuthPage {
  readonly form: Locator;
  readonly title: Locator;
  readonly subtitle: Locator;
  readonly nameInput: Locator;
  readonly registerButton: Locator;
  readonly loginButton: Locator;
  readonly switchModeButton: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.form = page.getByTestId('auth-form');
    this.title = page.getByTestId('auth-title');
    this.subtitle = page.getByTestId('auth-subtitle');
    this.nameInput = page.getByTestId('input-name');
    this.registerButton = page.getByTestId('btn-register');
    this.loginButton = page.getByTestId('btn-login');
    this.switchModeButton = page.getByTestId('btn-switch-mode');
    this.error = page.getByTestId('auth-error');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async register(name: string): Promise<void> {
    await this.nameInput.fill(name);
    await this.registerButton.click();
  }

  async switchToLogin(): Promise<void> {
    await this.switchModeButton.click();
  }

  async login(name: string): Promise<void> {
    await this.switchToLogin();
    await this.nameInput.fill(name);
    await this.loginButton.click();
  }
}
