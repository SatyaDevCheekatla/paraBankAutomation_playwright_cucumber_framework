import { type Browser, chromium, firefox, webkit } from "@playwright/test";

import { frameworkConfig, type SupportedBrowser } from "../config/env";

const browserTypes: Record<SupportedBrowser, typeof chromium> = {
  chromium,
  firefox,
  webkit
};

class BrowserManager {
  private browser?: Browser;

  async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await browserTypes[frameworkConfig.browser].launch({
        headless: frameworkConfig.headless,
        slowMo: frameworkConfig.slowMo
      });
    }

    return this.browser;
  }

  async closeBrowser(): Promise<void> {
    if (!this.browser) {
      return;
    }

    await this.browser.close();
    this.browser = undefined;
  }
}

export const browserManager = new BrowserManager();
