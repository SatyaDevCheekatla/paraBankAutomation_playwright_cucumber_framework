import { type IWorldOptions, World, setWorldConstructor } from "@cucumber/cucumber";
import type { BrowserContext, Page } from "@playwright/test";

import type { CustomerJourneyState } from "../../src/models/bank";

export class CustomWorld extends World {
  context?: BrowserContext;
  page?: Page;
  scenarioName?: string;
  tracePath?: string;
  journey: CustomerJourneyState;

  constructor(options: IWorldOptions) {
    super(options);
    this.journey = {
      accountNumbers: []
    };
  }

  getPage(): Page {
    if (!this.page) {
      throw new Error("Playwright page has not been initialized. Check the Cucumber hooks.");
    }

    return this.page;
  }
}

setWorldConstructor(CustomWorld);
