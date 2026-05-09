# ParaBank Playwright Cucumber Framework

This project is a UI automation framework for ParaBank built with Playwright, TypeScript, and Cucumber BDD.

The framework now focuses on:

- customer-friendly Cucumber dashboard reports
- dynamic and parallel-safe test data
- broader banking workflow coverage
- parallel execution across browsers and data sets
- GitHub Actions report publishing

## Tech stack

- Playwright
- TypeScript
- Cucumber
- `multiple-cucumber-html-reporter`
- `dotenv`

## Coverage

The current suite covers these customer journeys in [features/customer-lifecycle.feature](./features/customer-lifecycle.feature):

- registration with generated credentials
- opening a new savings account
- logout and login with the generated customer
- accounts overview validation
- transfer funds
- bill payment
- account activity review with screenshots
- contact-information update
- loan request and approval
- data-driven money-movement scenarios for `retail`, `premium`, and `student` profiles

## Project structure

```text
features/
  customer-lifecycle.feature
  step-definitions/
    customer-lifecycle.steps.ts
  support/
    hooks.ts
    world.ts

src/
  config/
    env.ts
  core/
    browserManager.ts
  models/
    bank.ts
  pages/
  utils/
    money.ts
    reporting.ts
    testDataFactory.ts

scripts/
  run-cucumber.mjs
  generate-cucumber-report.mjs
  report-utils.mjs
```

## Reporting

The framework generates:

- raw Cucumber JSON under `reports/cucumber-json/<run-id>/`
- customer-facing dashboard report under `reports/cucumber-html/<run-id>/`
- Playwright traces under `test-results/traces/<run-id>/`

The report output includes:

- pie-chart dashboard widgets
- feature-level drilldown pages
- browser and runtime metadata
- generated test-data attachments
- failure screenshots
- transaction screenshots
- styled dashboard visuals

Generate the latest HTML report with:

```bash
npm run report:generate
```

Generate and open it with:

```bash
npm run report:open
```

## Dynamic test data

Test data is generated automatically for every scenario. Each scenario gets its own:

- unique username and password
- profile-specific customer details
- payee details
- transfer amount
- bill amount
- loan data

The generated data is isolated by:

- run id
- Cucumber worker id
- scenario name
- random UUID suffix

This keeps same-browser parallel runs from colliding with each other.

## Parallel execution

### Same browser, different test data

Run multiple Cucumber workers in parallel:

```bash
npm run test:parallel
```

Or choose a worker count explicitly:

```bash
node ./scripts/run-cucumber.mjs --parallel 4
```

### Different browsers

Run a specific browser locally:

```bash
node ./scripts/run-cucumber.mjs --browser firefox
```

In GitHub Actions, the workflow runs the suite in parallel on:

- `chromium`
- `firefox`
- `webkit`

## Installation

Install dependencies:

```bash
npm install
```

Install Playwright browsers:

```bash
npm run pw:install:all
```

## Environment configuration

Create a `.env` file from `.env.example`.

Example:

```env
BASE_URL=https://parabank.parasoft.com/parabank/
PARABANK_USERNAME=john
PARABANK_PASSWORD=demo
BROWSER=chromium
HEADLESS=true
TIMEOUT=30000
SLOW_MO=0
PARALLEL=0
```

## Useful commands

Run the full suite:

```bash
npm test
```

Run smoke coverage:

```bash
npm run test:smoke
```

Run headed:

```bash
npm run test:headed
```

Run with debug-style slow motion:

```bash
npm run test:debug
```

Type-check the framework:

```bash
npm run typecheck
```

## GitHub Actions

The workflow in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml):

1. runs the suite on a browser matrix
2. runs Cucumber workers in parallel inside each browser job
3. uploads JSON, HTML, and trace artifacts
4. builds a combined Cucumber HTML report
5. publishes the combined report to GitHub Pages
6. optionally emails the report link when mail secrets and `REPORT_RECIPIENTS` are configured

## Notes

- The framework intentionally keeps `@cucumber/cucumber` on the current project version to avoid an unnecessary runner upgrade while changing the reporting layer.
- Playwright traces are still captured for failed scenarios, but they are uploaded as separate artifacts instead of inline HTML downloads.
