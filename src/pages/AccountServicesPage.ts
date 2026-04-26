import { expect, type Page } from "@playwright/test";

import { reportStep } from "../utils/reporting";

export class AccountServicesPage {
  constructor(private readonly page: Page) {}

  async assertWelcomeMessage(username: string): Promise<void> {
    await reportStep(`Validate that the account services area welcomes ${username}`, async () => {
      await expect(this.page.getByText(`Welcome ${username}`, { exact: true })).toBeVisible();
    });
  }

  async openAccountsOverview(): Promise<void> {
    await reportStep("Navigate to Accounts Overview", async () => {
      await this.page.getByRole("link", { name: "Accounts Overview" }).click();
    });
  }

  async openNewAccount(): Promise<void> {
    await reportStep("Navigate to Open New Account", async () => {
      await this.page.getByRole("link", { name: "Open New Account" }).click();
    });
  }

  async openTransferFunds(): Promise<void> {
    await reportStep("Navigate to Transfer Funds", async () => {
      await this.page.getByRole("link", { name: "Transfer Funds" }).click();
    });
  }

  async openBillPay(): Promise<void> {
    await reportStep("Navigate to Bill Pay", async () => {
      await this.page.getByRole("link", { name: "Bill Pay" }).click();
    });
  }

  async openUpdateContactInfo(): Promise<void> {
    await reportStep("Navigate to Update Contact Info", async () => {
      await this.page.getByRole("link", { name: "Update Contact Info" }).click();
    });
  }

  async openRequestLoan(): Promise<void> {
    await reportStep("Navigate to Request Loan", async () => {
      await this.page.getByRole("link", { name: "Request Loan" }).click();
    });
  }

  async logout(): Promise<void> {
    await reportStep("Log out of the current ParaBank session", async () => {
      await this.page.getByRole("link", { name: "Log Out" }).click();
      await expect(this.page.locator('input[value="Log In"]')).toBeVisible();
    });
  }
}
