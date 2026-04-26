import { expect, type Page } from "@playwright/test";

import type { AccountSummary } from "../models/bank";
import { parseCurrency } from "../utils/money";
import { reportStep } from "../utils/reporting";

export class AccountsOverviewPage {
  constructor(private readonly page: Page) {}

  private get heading() {
    return this.page.getByRole("heading", { name: "Accounts Overview", exact: true });
  }

  private get logoutLink() {
    return this.page.getByRole("link", { name: "Log Out" });
  }

  async assertLoaded(): Promise<void> {
    await reportStep("Validate that the accounts overview page is loaded", async () => {
      await expect(this.page).toHaveURL(/overview\.htm/);
      await expect(this.heading).toHaveText("Accounts Overview");
      await expect(this.logoutLink).toBeVisible();
      await expect(this.page.locator("#accountTable")).toBeVisible();
    });
  }

  async getAccounts(): Promise<AccountSummary[]> {
    return reportStep("Read the available accounts from the overview table", async () => {
      await this.waitForAccountRows();

      const rows = await this.page.locator("#accountTable tbody tr").evaluateAll((tableRows) =>
        tableRows.map((row) =>
          Array.from(row.querySelectorAll("td")).map((cell) =>
            cell.textContent?.replace(/\s+/g, " ").trim() ?? ""
          )
        )
      );

      return rows
        .filter((row) => /^\d+$/.test(row[0] ?? ""))
        .map((row) => ({
          accountNumber: row[0],
          balance: parseCurrency(row[1]),
          availableAmount: parseCurrency(row[2])
        }));
    });
  }

  async assertContainsAccount(accountNumber: string): Promise<void> {
    await reportStep(`Verify that account ${accountNumber} is present in the overview`, async () => {
      await expect(this.page.locator("#accountTable")).toContainText(accountNumber);
    });
  }

  async openAccountActivity(accountNumber: string): Promise<void> {
    await reportStep(`Open the activity page for account ${accountNumber}`, async () => {
      await this.page.locator(`#accountTable a[href*="id="]`, { hasText: accountNumber }).click();
    });
  }

  private async waitForAccountRows(): Promise<void> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const accountLinkCount = await this.page.locator("#accountTable a[href*='id=']").count();

      if (accountLinkCount > 0) {
        return;
      }

      await this.page.waitForTimeout(1_000);
    }
  }
}
