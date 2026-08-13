import type { Locator, Page } from '@playwright/test';

export type Language = 'en' | 'fa';
export type Theme = 'light' | 'dark';

/** Global header: app branding plus the language and theme switches. */
export class AppHeader {
  readonly title: Locator;
  readonly subtitle: Locator;
  readonly languageSelect: Locator;
  readonly themeButton: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('title');
    this.subtitle = page.getByTestId('subtitle');
    this.languageSelect = page.getByTestId('select-language');
    this.themeButton = page.getByTestId('btn-theme');
  }

  async selectLanguage(language: Language): Promise<void> {
    await this.languageSelect.selectOption(language);
  }

  async toggleTheme(): Promise<void> {
    await this.themeButton.click();
  }

  async currentTheme(): Promise<Theme> {
    return (await this.page.locator('html').getAttribute('data-theme')) as Theme;
  }

  async textDirection(): Promise<string | null> {
    return this.page.locator('html').getAttribute('dir');
  }
}
