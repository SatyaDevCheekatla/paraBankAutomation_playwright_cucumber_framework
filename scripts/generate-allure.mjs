import { existsSync, readFileSync } from "node:fs";
import { mkdirSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const allureRootDir = path.join(process.cwd(), "allure-results");
const latestRunFile = path.join(allureRootDir, ".latest-run");
const allureReportRootDir = path.join(process.cwd(), "allure-report");

if (!existsSync(latestRunFile)) {
  console.error("No Allure test run metadata found. Run the tests first.");
  process.exit(1);
}

const latestRunId = readFileSync(latestRunFile, "utf8").trim();
const allureResultsDir = path.join(allureRootDir, "runs", latestRunId);
const allureReportDir = path.join(allureReportRootDir, "runs", latestRunId);

if (!existsSync(allureResultsDir)) {
  console.error(`No allure results found for run "${latestRunId}". Run the tests again.`);
  process.exit(1);
}

mkdirSync(allureReportDir, { recursive: true });
writeFileSync(path.join(allureReportRootDir, ".latest-report"), latestRunId, "utf8");

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(command, ["allure", "generate", allureResultsDir, "--clean", "-o", allureReportDir], {
  cwd: process.cwd(),
  stdio: "inherit"
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
