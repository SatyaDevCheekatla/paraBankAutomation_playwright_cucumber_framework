import { existsSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const allureReportRootDir = path.join(process.cwd(), "allure-report");
const latestReportFile = path.join(allureReportRootDir, ".latest-report");

if (!existsSync(latestReportFile)) {
  console.error("No Allure HTML report metadata found. Run npm run report:generate first.");
  process.exit(1);
}

const latestReportId = readFileSync(latestReportFile, "utf8").trim();
const allureReportDir = path.join(allureReportRootDir, "runs", latestReportId);

if (!existsSync(allureReportDir)) {
  console.error(`No Allure HTML report found for run "${latestReportId}". Regenerate the report first.`);
  process.exit(1);
}

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(command, ["allure", "open", allureReportDir], {
  cwd: process.cwd(),
  stdio: "inherit"
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
