const resultsDir = process.env.ALLURE_RESULTS_DIR ?? "allure-results";

module.exports = {
  default: {
    paths: ["features/**/*.feature"],
    requireModule: ["ts-node/register"],
    require: ["features/**/*.ts"],
    format: [
      "progress-bar",
      "html:reports/cucumber-report.html",
      "json:reports/cucumber-report.json",
      "allure-cucumberjs/reporter"
    ],
    formatOptions: {
      resultsDir
    },
    parallel: 0
  }
};
