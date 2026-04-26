import { expect, type Page } from "@playwright/test";

import { formatCurrency } from "../utils/money";
import { reportStep } from "../utils/reporting";

export class RequestLoanPage {
  constructor(private readonly page: Page) {}

  async assertLoaded(): Promise<void> {
    await reportStep("Validate that the request-loan page is loaded", async () => {
      await expect(this.page).toHaveURL(/requestloan\.htm/);
      await expect(this.page.getByRole("heading", { name: "Apply for a Loan", exact: true })).toBeVisible();
      await expect(this.page.locator("#amount")).toBeVisible();
      await expect(this.page.locator("#downPayment")).toBeVisible();
    });
  }

  async applyForLoan(amount: number, downPayment: number, fundingAccountNumber: string): Promise<string> {
    return reportStep(
      `Apply for a $${formatCurrency(amount)} loan with a $${formatCurrency(downPayment)} down payment from account ${fundingAccountNumber}`,
      async () => {
        await this.page.locator("#amount").fill(formatCurrency(amount));
        await this.page.locator("#downPayment").fill(formatCurrency(downPayment));
        await this.page.locator("#fromAccountId").selectOption(fundingAccountNumber);
        await this.page.locator('input[value="Apply Now"]').click();

        const resultPanel = this.page.locator("#requestLoanResult");
        await expect(
          this.page.getByRole("heading", { name: "Loan Request Processed", exact: true })
        ).toBeVisible();
        await expect(resultPanel).toContainText("Approved");
        await expect(resultPanel.locator("#newAccountId")).toHaveText(/^\d+$/);

        return (await resultPanel.locator("#newAccountId").textContent())?.trim() ?? "";
      }
    );
  }
}
