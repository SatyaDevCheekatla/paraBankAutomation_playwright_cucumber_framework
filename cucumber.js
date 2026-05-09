const path = require("node:path");

const runId = process.env.TEST_RUN_ID ?? "local";
const browser = process.env.BROWSER ?? "chromium";
const workerId = process.env.CUCUMBER_WORKER_ID ?? "0";
const resultsDir = process.env.CUCUMBER_JSON_DIR ?? path.join("reports", "cucumber-json", runId);
const jsonReportPath = path.join(resultsDir, `${browser}-worker-${workerId}-${runId}.json`);
const quotedJsonFormatter = `"json":"${jsonReportPath.replace(/\\/g, "\\\\")}"`;

module.exports = {
  default: {
    paths: ["features/**/*.feature"],
    requireModule: ["ts-node/register"],
    require: ["features/**/*.ts"],
    format: ["progress-bar", "summary", quotedJsonFormatter],
    parallel: Number(process.env.PARALLEL ?? 0)
  }
};
