import { expect, type Page } from "@playwright/test";

import type { ContactInfoData } from "../models/bank";
import { reportStep } from "../utils/reporting";

export class UpdateContactInfoPage {
  constructor(private readonly page: Page) {}

  async assertLoaded(): Promise<void> {
    await reportStep("Validate that the update-contact-info page is loaded", async () => {
      await expect(this.page).toHaveURL(/updateprofile\.htm/);
      await expect(this.page.getByRole("heading", { name: "Update Profile", exact: true })).toBeVisible();
      await expect(this.page.locator('[name="customer.firstName"]')).toBeVisible();
    });
  }

  async updateContactInfo(contactInfo: ContactInfoData): Promise<void> {
    await reportStep("Update the customer contact information", async () => {
      await this.page.locator('[name="customer.firstName"]').fill(contactInfo.firstName);
      await this.page.locator('[name="customer.lastName"]').fill(contactInfo.lastName);
      await this.page.locator('[name="customer.address.street"]').fill(contactInfo.street);
      await this.page.locator('[name="customer.address.city"]').fill(contactInfo.city);
      await this.page.locator('[name="customer.address.state"]').fill(contactInfo.state);
      await this.page.locator('[name="customer.address.zipCode"]').fill(contactInfo.zipCode);
      await this.page.locator('[name="customer.phoneNumber"]').fill(contactInfo.phoneNumber);
      await this.page.locator('input[value="Update Profile"]').click();

      const resultPanel = this.page.locator("#updateProfileResult");
      await expect(
        this.page.getByRole("heading", { name: "Profile Updated", exact: true })
      ).toBeVisible();
      await expect(resultPanel).toContainText("updated address and phone number");
    });
  }
}
