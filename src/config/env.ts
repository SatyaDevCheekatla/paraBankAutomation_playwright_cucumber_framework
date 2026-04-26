import dotenv from "dotenv";

dotenv.config({ quiet: true });

export type SupportedBrowser = "chromium" | "firefox" | "webkit";

interface FrameworkConfig {
  baseUrl: string;
  browser: SupportedBrowser;
  headless: boolean;
  slowMo: number;
  timeout: number;
  credentials: {
    username: string;
    password: string;
  };
}

const supportedBrowsers: SupportedBrowser[] = ["chromium", "firefox", "webkit"];

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) {
    return fallback;
  }

  return value.toLowerCase() === "true";
};

const parseNumber = (value: string | undefined, fallback: number): number => {
  if (value === undefined) {
    return fallback;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

const configuredBrowser = (process.env.BROWSER ?? "chromium").toLowerCase() as SupportedBrowser;

if (!supportedBrowsers.includes(configuredBrowser)) {
  throw new Error(`Unsupported browser "${configuredBrowser}". Use one of: ${supportedBrowsers.join(", ")}.`);
}

export const frameworkConfig: FrameworkConfig = {
  baseUrl: process.env.BASE_URL ?? "https://parabank.parasoft.com/parabank/",
  browser: configuredBrowser,
  headless: parseBoolean(process.env.HEADLESS, true),
  slowMo: parseNumber(process.env.SLOW_MO, 0),
  timeout: parseNumber(process.env.TIMEOUT, 30_000),
  credentials: {
    username: process.env.PARABANK_USERNAME ?? "john",
    password: process.env.PARABANK_PASSWORD ?? "demo"
  }
};
