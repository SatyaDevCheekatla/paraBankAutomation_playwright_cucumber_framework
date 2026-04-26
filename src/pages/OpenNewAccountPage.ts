import { expect, type Page } from "@playwright/test";

import { reportStep } from "../utils/reporting";

export class OpenNewAccountPage {
  constructor(private readonly page: Page) {}

  private get accountTypeSelect() {
    return this.page.locator("#type");
  }

  private get fundingAccountSelect() {
    return this.page.locator("#fromAccountId");
  }

  private get openAccountButton() {
    return this.page.locator('input.button, input[value="Open New Account"]');
  }

  private get resultHeading() {
    return this.page.getByRole("heading", { name: "Account Opened!", exact: true });
  }

  private get newAccountIdLink() {
    return this.page.locator("#newAccountId");
  }

  async assertLoaded(): Promise<void> {
    await reportStep("Validate that the open-account page is loaded", async () => {
      await expect(this.page).toHaveURL(/openaccount\.htm/);
      await expect(this.page.getByRole("heading", { name: "Open New Account", exact: true })).toBeVisible();
      await expect(this.accountTypeSelect).toBeVisible();
      await expect(this.fundingAccountSelect).toBeVisible();
    });
  }

  async openSavingsAccount(fromAccountNumber: string): Promise<string> {
    return reportStep(`Open a savings account using account ${fromAccountNumber} as the funding source`, async () => {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const optionCount = await this.fundingAccountSelect.locator("option").count();

        if (optionCount > 0) {
          break;
        }

        await this.page.waitForTimeout(1_000);
      }

      await this.accountTypeSelect.selectOption("1");
      await this.fundingAccountSelect.selectOption(fromAccountNumber);
      await this.openAccountButton.click();
      await expect(this.resultHeading).toBeVisible();
      await expect(this.newAccountIdLink).toHaveText(/^\d+$/);

      return (await this.newAccountIdLink.textContent())?.trim() ?? "";
    });
  }
}
