import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const env = { ...process.env };
const args = process.argv.slice(2);
const cucumberArgs = ["cucumber-js", "--config", "cucumber.js"];
const runId = new Date().toISOString().replace(/[:.]/g, "-");
const allureRootDir = path.join(projectRoot, "allure-results");
const allureRunDir = path.join(allureRootDir, "runs", runId);
const traceRunDir = path.join(projectRoot, "test-results", "traces", runId);

env.ALLURE_RESULTS_DIR = allureRunDir;
env.TRACE_DIR = traceRunDir;

const consumeValue = (index, optionName) => {
  const value = args[index + 1];

  if (!value) {
    throw new Error(`Missing value for ${optionName}`);
  }

  return value;
};

for (let index = 0; index < args.length; index += 1) {
  const argument = args[index];

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

  if (argument === "--slowmo") {
    env.SLOW_MO = consumeValue(index, "--slowmo");
    index += 1;
    continue;
  }

  if (argument === "--tags") {
    cucumberArgs.push("--tags", consumeValue(index, "--tags"));
    index += 1;
    continue;
  }

  cucumberArgs.push(argument);
}

mkdirSync(allureRunDir, { recursive: true });
mkdirSync(path.join(projectRoot, "reports"), { recursive: true });
mkdirSync(traceRunDir, { recursive: true });
writeFileSync(path.join(allureRootDir, ".latest-run"), runId, "utf8");

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(command, cucumberArgs, {
  cwd: projectRoot,
  env,
  stdio: "inherit"
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
