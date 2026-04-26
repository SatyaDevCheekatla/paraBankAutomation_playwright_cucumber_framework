import { expect, type Page } from "@playwright/test";

import type { PayeeData } from "../models/bank";
import { formatCurrency } from "../utils/money";
import { reportStep } from "../utils/reporting";

export class BillPayPage {
  constructor(private readonly page: Page) {}

  async assertLoaded(): Promise<void> {
    await reportStep("Validate that the bill-pay page is loaded", async () => {
      await expect(this.page).toHaveURL(/billpay\.htm/);
      await expect(
        this.page.getByRole("heading", { name: "Bill Payment Service", exact: true })
      ).toBeVisible();
      await expect(this.page.locator('[name="payee.name"]')).toBeVisible();
    });
  }

  async makePayment(payee: PayeeData, amount: number, fromAccountNumber: string): Promise<void> {
    await reportStep(
      `Submit a bill payment of $${formatCurrency(amount)} from account ${fromAccountNumber}`,
      async () => {
        await this.page.locator('[name="payee.name"]').fill(payee.name);
        await this.page.locator('[name="payee.address.street"]').fill(payee.street);
        await this.page.locator('[name="payee.address.city"]').fill(payee.city);
        await this.page.locator('[name="payee.address.state"]').fill(payee.state);
        await this.page.locator('[name="payee.address.zipCode"]').fill(payee.zipCode);
        await this.page.locator('[name="payee.phoneNumber"]').fill(payee.phoneNumber);
        await this.page.locator('[name="payee.accountNumber"]').fill(payee.accountNumber);
        await this.page.locator('[name="verifyAccount"]').fill(payee.accountNumber);
        await this.page.locator('[name="amount"]').fill(formatCurrency(amount));
        await this.page.locator('[name="fromAccountId"]').selectOption(fromAccountNumber);
        await this.page.locator('input[value="Send Payment"]').click();

        const resultPanel = this.page.locator("#billpayResult");
        await expect(
          this.page.getByRole("heading", { name: "Bill Payment Complete", exact: true })
        ).toBeVisible();
        await expect(resultPanel).toContainText("was successful");
      }
    );
  }
}
