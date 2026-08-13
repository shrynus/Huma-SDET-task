import type { Locator, Page } from '@playwright/test';

/**
 * Clicks a control guarded by a native `confirm()` dialog and either accepts or
 * dismisses it, returning the dialog text.
 *
 * The click is intentionally not awaited before the dialog is handled: in some
 * browsers `click()` does not resolve while a modal dialog is open.
 */
export async function handleConfirm(
  page: Page,
  trigger: Locator,
  accept: boolean,
): Promise<string> {
  const dialogEvent = page.waitForEvent('dialog');
  const click = trigger.click();

  const dialog = await dialogEvent;
  const message = dialog.message();
  await (accept ? dialog.accept() : dialog.dismiss());

  await click;
  return message;
}
