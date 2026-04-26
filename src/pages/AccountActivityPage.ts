import { expect, type Page } from "@playwright/test";
import { ContentType } from "allure-js-commons";
import * as allure from "allure-js-commons";

import { reportStep } from "../utils/reporting";

export class AccountActivityPage {
  constructor(private readonly page: Page) {}

  async assertLoaded(accountNumber: string): Promise<void> {
    await reportStep(`Validate that the account activity page is loaded for account ${accountNumber}`, async () => {
      await expect(this.page).toHaveURL(new RegExp(`activity\\.htm\\?id=${accountNumber}`));
      await expect(this.page.getByRole("heading", { name: "Account Activity", exact: true })).toBeVisible();
      await expect(this.page.locator("#accountDetails")).toContainText(accountNumber);
    });
  }

  async assertTransactionsPresent(): Promise<void> {
    await reportStep("Verify that at least one transaction is displayed", async () => {
      await expect(this.page.locator("#transactionTable tbody tr").first()).toBeVisible();
    });
  }

  async attachScreenshot(accountNumber: string): Promise<void> {
    await reportStep(`Capture the transaction screenshot for account ${accountNumber}`, async () => {
      const screenshot = await this.page.screenshot({ fullPage: true });
      await allure.attachment(`Transactions - ${accountNumber}`, screenshot, ContentType.PNG);
    });
  }
}
