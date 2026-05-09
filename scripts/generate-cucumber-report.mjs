import { copyFileSync, existsSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import report from "multiple-cucumber-html-reporter";

import {
  buildRunInfo,
  enrichJsonFilesWithMetadata,
  ensureDirectory,
  formatTimestamp,
  latestReportInfoPath,
  latestRunInfoPath,
  readLatestInfo,
  resolveRunDirectories,
  sanitizeFileName,
  writeJsonFile
} from "./report-utils.mjs";

const args = process.argv.slice(2);

const consumeValue = (flagName) => {
  const optionIndex = args.indexOf(flagName);

  if (optionIndex === -1) {
    return undefined;
  }

  return args[optionIndex + 1];
};

const shouldOpenReport = args.includes("--open");
const explicitJsonDir = consumeValue("--jsonDir");
const explicitReportDir = consumeValue("--reportDir");
const explicitRunId = consumeValue("--runId");
const latestRunInfo = readLatestInfo(latestRunInfoPath);

const derivedRunInfo =
  latestRunInfo ??
  buildRunInfo({
    runId: explicitRunId ?? `ad-hoc-${Date.now()}`,
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    browser: process.env.BROWSER ?? "chromium",
    parallelWorkers: Number(process.env.PARALLEL ?? 0),
    baseUrl: process.env.BASE_URL ?? "https://parabank.parasoft.com/parabank/",
    headless: process.env.HEADLESS ?? "true"
  });

const resolvedDirectories = resolveRunDirectories(explicitRunId ?? derivedRunInfo.runId);
const jsonDir = explicitJsonDir ? path.resolve(explicitJsonDir) : resolvedDirectories.runJsonDir;
const reportDir = explicitReportDir ? path.resolve(explicitReportDir) : resolvedDirectories.runHtmlDir;

if (!existsSync(jsonDir)) {
  console.error(`No Cucumber JSON directory found at "${jsonDir}". Run the tests first.`);
  process.exit(1);
}

const jsonFiles = enrichJsonFilesWithMetadata(jsonDir, derivedRunInfo);

if (jsonFiles.length === 0) {
  console.error(`No Cucumber JSON files were found under "${jsonDir}".`);
  process.exit(1);
}

const stagedJsonDir = path.join(
  os.tmpdir(),
  "parabank-cucumber-report",
  sanitizeFileName(derivedRunInfo.runId)
);

rmSync(stagedJsonDir, { recursive: true, force: true });
ensureDirectory(stagedJsonDir);

jsonFiles.forEach((jsonFilePath, index) => {
  const targetFileName = `${index.toString().padStart(3, "0")}-${path.basename(jsonFilePath)}`;
  copyFileSync(jsonFilePath, path.join(stagedJsonDir, targetFileName));
});

rmSync(reportDir, { recursive: true, force: true });
ensureDirectory(reportDir);

const uniqueBrowsers = [
  ...new Set(
    jsonFiles.map((jsonFilePath) => path.basename(jsonFilePath).split("-worker-")[0]).filter(Boolean)
  )
];

report.generate({
  jsonDir: stagedJsonDir,
  reportPath: reportDir,
  displayDuration: true,
  durationAggregation: "sum",
  displayReportTime: true,
  saveCollectedJSON: false,
  openReportInBrowser: shouldOpenReport,
  pageTitle: "ParaBank Automation Dashboard",
  reportName: "ParaBank Test Execution Dashboard",
  customStyle: path.join(process.cwd(), "scripts", "report-theme.css"),
  pageFooter:
    '<div style="padding: 18px 24px; text-align: center; color: #5c685e; font-size: 12px;">ParaBank Playwright Framework · Styled Cucumber dashboard with pie charts, metadata, and scenario drilldown pages.</div>',
  customData: {
    title: "Run Information",
    data: [
      { label: "Run ID", value: derivedRunInfo.runId },
      { label: "Browsers", value: uniqueBrowsers.join(", ") || derivedRunInfo.browser },
      { label: "Parallel Workers", value: String(derivedRunInfo.parallelWorkers) },
      { label: "Base URL", value: derivedRunInfo.baseUrl },
      { label: "Execution Start", value: formatTimestamp(derivedRunInfo.startTime) },
      { label: "Execution End", value: formatTimestamp(derivedRunInfo.endTime) }
    ]
  }
});

writeJsonFile(latestReportInfoPath, {
  runId: derivedRunInfo.runId,
  jsonDir,
  reportDir,
  dashboardPath: path.join(reportDir, "index.html")
});

console.log(`Generated styled Cucumber dashboard at ${path.join(reportDir, "index.html")}`);
