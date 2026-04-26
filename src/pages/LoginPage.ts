import { expect, type Page } from "@playwright/test";

import { reportStep } from "../utils/reporting";

export class LoginPage {
  constructor(private readonly page: Page) {}

  private get usernameInput() {
    return this.page.locator('input[name="username"]');
  }

  private get passwordInput() {
    return this.page.locator('input[name="password"]');
  }

  private get signInButton() {
    return this.page.locator('input[value="Log In"]');
  }

  private get registerLink() {
    return this.page.getByRole("link", { name: "Register" });
  }

  async open(): Promise<void> {
    await reportStep("Open the ParaBank login page", async () => {
      await this.page.goto("index.htm");
    });
  }

  async assertLoaded(): Promise<void> {
    await reportStep("Validate that the login page is loaded", async () => {
      await expect(this.page).toHaveTitle(/ParaBank/);
      await expect(this.usernameInput).toBeVisible();
      await expect(this.passwordInput).toBeVisible();
      await expect(this.signInButton).toBeVisible();
      await expect(this.registerLink).toBeVisible();
    });
  }

  async openRegistrationPage(): Promise<void> {
    await reportStep("Navigate to the registration page", async () => {
      await this.registerLink.click();
    });
  }

  async login(username: string, password: string): Promise<void> {
    await reportStep(`Log in as ${username}`, async () => {
      await this.usernameInput.fill(username);
      await this.passwordInput.fill(password);
      await this.signInButton.click();
    });
  }
}
