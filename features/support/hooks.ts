import "allure-cucumberjs";

import { mkdir } from "node:fs/promises";
import path from "node:path";

import {
  After,
  AfterAll,
  Before,
  BeforeAll,
  type ITestCaseHookParameter,
  Status,
  setDefaultTimeout
} from "@cucumber/cucumber";
import { ContentType } from "allure-js-commons";
import * as allure from "allure-js-commons";

import { frameworkConfig } from "../../src/config/env";
import { browserManager } from "../../src/core/browserManager";
import { CustomWorld } from "./world";

setDefaultTimeout(Math.max(frameworkConfig.timeout, 180_000));

const sanitizeFileName = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const traceDirectory = process.env.TRACE_DIR ?? path.join(process.cwd(), "test-results", "traces");

BeforeAll(async () => {
  await browserManager.getBrowser();
});

Before(async function (this: CustomWorld, { pickle }: ITestCaseHookParameter) {
  const browser = await browserManager.getBrowser();

  this.scenarioName = pickle.name;
  this.tracePath = path.join(
    traceDirectory,
    `${Date.now()}-${sanitizeFileName(pickle.name)}.zip`
  );

  await allure.parentSuite("ParaBank");
  await allure.suite("Cucumber BDD");
  await allure.displayName(pickle.name);
  await allure.parameter("browser", frameworkConfig.browser);

  this.context = await browser.newContext({
    baseURL: frameworkConfig.baseUrl,
    ignoreHTTPSErrors: true,
    viewport: { width: 1440, height: 900 }
  });

  await this.context.tracing.start({
    screenshots: true,
    snapshots: true
  });

  this.page = await this.context.newPage();
});

After(async function (this: CustomWorld, { result }: ITestCaseHookParameter) {
  const scenarioFailed = result?.status === Status.FAILED;

  try {
    if (scenarioFailed && this.page) {
      const screenshot = await this.page.screenshot({ fullPage: true });
      await allure.attachment("Failure screenshot", screenshot, ContentType.PNG);
    }

    if (this.context) {
      if (scenarioFailed && this.tracePath) {
        await mkdir(path.dirname(this.tracePath), { recursive: true });
        await this.context.tracing.stop({ path: this.tracePath });
        await allure.attachmentPath("Playwright trace", this.tracePath, {
          contentType: "application/zip",
          fileExtension: "zip"
        });
      } else {
        await this.context.tracing.stop();
      }
    }
  } finally {
    await this.context?.close();
    this.page = undefined;
    this.context = undefined;
    this.tracePath = undefined;
  }
});

AfterAll(async () => {
  await browserManager.closeBrowser();
});
