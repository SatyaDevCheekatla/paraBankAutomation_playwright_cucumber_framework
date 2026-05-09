import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export const projectRoot = process.cwd();
export const reportsRootDir = path.join(projectRoot, "reports");
export const latestRunInfoPath = path.join(reportsRootDir, ".latest-run.json");
export const latestReportInfoPath = path.join(reportsRootDir, ".latest-report.json");

export const sanitizeFileName = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const ensureDirectory = (directoryPath) => {
  mkdirSync(directoryPath, { recursive: true });
};

export const writeJsonFile = (filePath, content) => {
  ensureDirectory(path.dirname(filePath));
  writeFileSync(filePath, `${JSON.stringify(content, null, 2)}\n`, "utf8");
};

export const readJsonFile = (filePath) => JSON.parse(readFileSync(filePath, "utf8"));

export const resolveRunDirectories = (runId) => {
  const jsonRootDir = path.join(reportsRootDir, "cucumber-json");
  const htmlRootDir = path.join(reportsRootDir, "cucumber-html");

  return {
    jsonRootDir,
    htmlRootDir,
    runJsonDir: path.join(jsonRootDir, runId),
    runHtmlDir: path.join(htmlRootDir, runId),
    traceRunDir: path.join(projectRoot, "test-results", "traces", runId)
  };
};

const normalizeBrowserName = (browser) => {
  switch (browser) {
    case "chromium":
      return "chrome";
    case "webkit":
      return "safari";
    default:
      return browser;
  }
};

const normalizePlatformName = (platform) => {
  switch (platform) {
    case "win32":
      return "windows";
    case "darwin":
      return "osx";
    default:
      return platform;
  }
};

export const buildRunInfo = ({
  runId,
  startTime,
  endTime,
  browser,
  parallelWorkers,
  baseUrl,
  headless
}) => ({
  runId,
  browser,
  parallelWorkers,
  baseUrl,
  headless,
  startTime,
  endTime,
  platform: process.platform,
  platformVersion: os.release(),
  hostname: os.hostname(),
  nodeVersion: process.version,
  ci: process.env.CI === "true"
});

export const buildFeatureMetadata = (runInfo) => ({
  browser: {
    name: normalizeBrowserName(runInfo.browser),
    version: "latest"
  },
  device: runInfo.ci ? "GitHub Actions" : runInfo.hostname,
  platform: {
    name: normalizePlatformName(runInfo.platform),
    version: runInfo.platformVersion
  }
});

export const collectJsonFiles = (directoryPath) => {
  if (!existsSync(directoryPath)) {
    return [];
  }

  const entries = readdirSync(directoryPath, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      return collectJsonFiles(entryPath);
    }

    return entry.isFile() && entry.name.endsWith(".json") ? [entryPath] : [];
  });
};

export const enrichJsonFilesWithMetadata = (jsonDirectoryPath, runInfo) => {
  const jsonFiles = collectJsonFiles(jsonDirectoryPath);
  const metadata = buildFeatureMetadata(runInfo);

  for (const jsonFilePath of jsonFiles) {
    const parsedReport = readJsonFile(jsonFilePath);

    if (!Array.isArray(parsedReport)) {
      continue;
    }

    const enrichedReport = parsedReport.map((feature) => ({
      ...feature,
      metadata: feature.metadata ?? metadata
    }));

    writeJsonFile(jsonFilePath, enrichedReport);
  }

  return jsonFiles;
};

export const readLatestInfo = (filePath) => {
  if (!existsSync(filePath)) {
    return undefined;
  }

  return readJsonFile(filePath);
};

export const formatTimestamp = (value) =>
  new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "medium"
  });
