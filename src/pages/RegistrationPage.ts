import { expect, type Page } from "@playwright/test";

import type { CustomerRegistrationData } from "../models/bank";
import { reportStep } from "../utils/reporting";

export class RegistrationPage {
  constructor(private readonly page: Page) {}

  async assertLoaded(): Promise<void> {
    await reportStep("Validate that the registration page is loaded", async () => {
      await expect(this.page).toHaveURL(/register\.htm/);
      await expect(
        this.page.getByRole("heading", { name: "Signing up is easy!", exact: true })
      ).toBeVisible();
      await expect(this.page.locator('[name="customer.firstName"]')).toBeVisible();
    });
  }

  async registerCustomer(customer: CustomerRegistrationData): Promise<void> {
    await reportStep("Fill the customer registration form", async () => {
      await this.page.locator('[name="customer.firstName"]').fill(customer.firstName);
      await this.page.locator('[name="customer.lastName"]').fill(customer.lastName);
      await this.page.locator('[name="customer.address.street"]').fill(customer.street);
      await this.page.locator('[name="customer.address.city"]').fill(customer.city);
      await this.page.locator('[name="customer.address.state"]').fill(customer.state);
      await this.page.locator('[name="customer.address.zipCode"]').fill(customer.zipCode);
      await this.page.locator('[name="customer.phoneNumber"]').fill(customer.phoneNumber);
      await this.page.locator('[name="customer.ssn"]').fill(customer.ssn);
      await this.page.locator('[name="customer.username"]').fill(customer.username);
      await this.page.locator('[name="customer.password"]').fill(customer.password);
      await this.page.locator('[name="repeatedPassword"]').fill(customer.password);
    });

    await reportStep("Submit the registration form", async () => {
      await this.page.locator('input[value="Register"]').click();
    });
  }

  async assertRegistrationSucceeded(username: string): Promise<void> {
    await reportStep("Validate that the customer registration succeeded", async () => {
      await expect(this.page.getByText(`Welcome ${username}`, { exact: true })).toBeVisible();
    });
  }
}
