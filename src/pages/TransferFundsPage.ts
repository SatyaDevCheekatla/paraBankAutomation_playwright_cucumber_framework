import { expect, type Page } from "@playwright/test";

import { formatCurrency } from "../utils/money";
import { reportStep } from "../utils/reporting";

export class TransferFundsPage {
  constructor(private readonly page: Page) {}

  async assertLoaded(): Promise<void> {
    await reportStep("Validate that the transfer-funds page is loaded", async () => {
      await expect(this.page).toHaveURL(/transfer\.htm/);
      await expect(this.page.getByRole("heading", { name: "Transfer Funds", exact: true })).toBeVisible();
      await expect(this.page.locator("#amount")).toBeVisible();
    });
  }

  async transferFunds(amount: number, fromAccountNumber: string, toAccountNumber: string): Promise<void> {
    await reportStep(
      `Transfer $${formatCurrency(amount)} from account ${fromAccountNumber} to account ${toAccountNumber}`,
      async () => {
        await this.page.locator("#amount").fill(formatCurrency(amount));
        await this.page.locator("#fromAccountId").selectOption(fromAccountNumber);
        await this.page.locator("#toAccountId").selectOption(toAccountNumber);
        await this.page.locator('input[value="Transfer"]').click();

        const resultPanel = this.page.locator("#showResult");
        await expect(
          this.page.getByRole("heading", { name: "Transfer Complete!", exact: true })
        ).toBeVisible();
        await expect(resultPanel).toContainText(`$${formatCurrency(amount)}`);
        await expect(resultPanel).toContainText(fromAccountNumber);
        await expect(resultPanel).toContainText(toAccountNumber);
      }
    );
  }
}
