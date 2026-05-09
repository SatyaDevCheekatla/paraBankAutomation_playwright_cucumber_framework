import { rmSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

import {
  buildRunInfo,
  enrichJsonFilesWithMetadata,
  ensureDirectory,
  latestReportInfoPath,
  latestRunInfoPath,
  reportsRootDir,
  resolveRunDirectories,
  writeJsonFile
} from "./report-utils.mjs";

const projectRoot = process.cwd();
const env = { ...process.env };
const args = process.argv.slice(2);
const cucumberArgs = ["cucumber-js", "--config", "cucumber.js"];
const runId = new Date().toISOString().replace(/[:.]/g, "-");
const executionStart = new Date().toISOString();
const { runJsonDir, traceRunDir } = resolveRunDirectories(runId);
const tracesRootDir = path.join(projectRoot, "test-results", "traces");

env.TEST_RUN_ID = runId;
env.CUCUMBER_JSON_DIR = runJsonDir;
env.TRACE_DIR = traceRunDir;
env.PARALLEL = env.PARALLEL ?? "0";

const consumeValue = (index, optionName) => {
  const value = args[index + 1];

  if (!value) {
    throw new Error(`Missing value for ${optionName}`);
  }

  return value;
};

for (let index = 0; index < args.length; index += 1) {
  const argument = args[index];

  if (argument.startsWith("--browser=")) {
    env.BROWSER = argument.slice("--browser=".length);
    continue;
  }

  if (argument === "--headed") {
    env.HEADLESS = "false";
    continue;
  }

  if (argument === "--headless") {
    env.HEADLESS = "true";
    continue;
  }

  if (argument === "--browser") {
    env.BROWSER = consumeValue(index, "--browser");
    index += 1;
    continue;
  }

  if (argument.startsWith("--slowmo=")) {
    env.SLOW_MO = argument.slice("--slowmo=".length);
    continue;
  }

  if (argument === "--slowmo") {
    env.SLOW_MO = consumeValue(index, "--slowmo");
    index += 1;
    continue;
  }

  if (argument.startsWith("--parallel=")) {
    env.PARALLEL = argument.slice("--parallel=".length);
    continue;
  }

  if (argument === "--parallel") {
    env.PARALLEL = consumeValue(index, "--parallel");
    index += 1;
    continue;
  }

  if (argument.startsWith("--tags=")) {
    cucumberArgs.push("--tags", argument.slice("--tags=".length));
    continue;
  }

  if (argument === "--tags") {
    cucumberArgs.push("--tags", consumeValue(index, "--tags"));
    index += 1;
    continue;
  }

  cucumberArgs.push(argument);
}

rmSync(reportsRootDir, { recursive: true, force: true });
rmSync(tracesRootDir, { recursive: true, force: true });

ensureDirectory(runJsonDir);
ensureDirectory(reportsRootDir);
ensureDirectory(traceRunDir);

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(command, cucumberArgs, {
  cwd: projectRoot,
  env,
  stdio: "inherit"
});

const generateReport = () =>
  new Promise((resolve) => {
    const reportProcess = spawn(process.execPath, ["./scripts/generate-cucumber-report.mjs"], {
      cwd: projectRoot,
      env,
      stdio: "inherit"
    });

    reportProcess.on("exit", (reportCode) => {
      resolve(reportCode ?? 1);
    });
  });

child.on("exit", async (code) => {
  const executionEnd = new Date().toISOString();
  const runInfo = buildRunInfo({
    runId,
    startTime: executionStart,
    endTime: executionEnd,
    browser: env.BROWSER ?? "chromium",
    parallelWorkers: Number(env.PARALLEL ?? 0),
    baseUrl: env.BASE_URL ?? "https://parabank.parasoft.com/parabank/",
    headless: env.HEADLESS ?? "true"
  });

  enrichJsonFilesWithMetadata(runJsonDir, runInfo);
  writeJsonFile(latestRunInfoPath, {
    ...runInfo,
    jsonDir: runJsonDir,
    traceDir: traceRunDir
  });
  writeJsonFile(latestReportInfoPath, {
    runId,
    jsonDir: runJsonDir
  });

  const reportCode = await generateReport();
  const cucumberCode = code ?? 1;

  process.exit(cucumberCode !== 0 ? cucumberCode : reportCode);
});
