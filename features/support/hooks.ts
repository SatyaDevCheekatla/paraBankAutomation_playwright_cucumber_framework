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

import { frameworkConfig } from "../../src/config/env";
import { browserManager } from "../../src/core/browserManager";
import {
  attachText,
  attachImage,
  setScenarioReportingContext
} from "../../src/utils/reporting";
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
  setScenarioReportingContext({
    attach: this.attach,
    log: this.log,
    link: this.link
  });
});

After(async function (this: CustomWorld, { result }: ITestCaseHookParameter) {
  const scenarioFailed = result?.status === Status.FAILED;

  try {
    if (scenarioFailed && this.page) {
      const screenshot = await this.page.screenshot({ fullPage: true });
      await attachImage("Failure screenshot", screenshot);
    }

    if (this.context) {
      if (scenarioFailed && this.tracePath) {
        await mkdir(path.dirname(this.tracePath), { recursive: true });
        await this.context.tracing.stop({ path: this.tracePath });
        await attachText("Playwright trace", `Trace saved to: ${this.tracePath}`);
      } else {
        await this.context.tracing.stop();
      }
    }
  } finally {
    setScenarioReportingContext(undefined);
    await this.context?.close();
    this.page = undefined;
    this.context = undefined;
    this.tracePath = undefined;
  }
});

AfterAll(async () => {
  await browserManager.closeBrowser();
});
