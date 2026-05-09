import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";

import type { AccountSummary, TestDataProfile } from "../../src/models/bank";
import { AccountActivityPage } from "../../src/pages/AccountActivityPage";
import { AccountsOverviewPage } from "../../src/pages/AccountsOverviewPage";
import { AccountServicesPage } from "../../src/pages/AccountServicesPage";
import { BillPayPage } from "../../src/pages/BillPayPage";
import { LoginPage } from "../../src/pages/LoginPage";
import { OpenNewAccountPage } from "../../src/pages/OpenNewAccountPage";
import { RegistrationPage } from "../../src/pages/RegistrationPage";
import { RequestLoanPage } from "../../src/pages/RequestLoanPage";
import { TransferFundsPage } from "../../src/pages/TransferFundsPage";
import { UpdateContactInfoPage } from "../../src/pages/UpdateContactInfoPage";
import {
  createBillAmount,
  createLoanRequestData,
  createPayeeData,
  createRegistrationData,
  createScenarioDataContext,
  createTransferAmount,
  createUpdatedContactInfo,
  defaultTestDataProfile
} from "../../src/utils/testDataFactory";
import { CustomWorld } from "../support/world";

const sortAccountsByBalanceDescending = (accounts: AccountSummary[]): AccountSummary[] =>
  [...accounts].sort((left, right) => right.balance - left.balance);

const parseProfile = (value?: string): TestDataProfile => {
  const normalizedValue = (value ?? defaultTestDataProfile).trim().toLowerCase();

  if (
    normalizedValue !== "retail" &&
    normalizedValue !== "premium" &&
    normalizedValue !== "student"
  ) {
    throw new Error(`Unsupported data profile "${value}". Use retail, premium, or student.`);
  }

  return normalizedValue;
};

const getOrCreateDataContext = (
  world: CustomWorld,
  requestedProfile?: string
) => {
  const profile = parseProfile(requestedProfile ?? world.dataProfile ?? defaultTestDataProfile);

  world.dataProfile = profile;

  if (!world.testDataContext || world.testDataContext.profile !== profile) {
    world.testDataContext = createScenarioDataContext(world.scenarioName ?? "parabank-scenario", profile);
  }

  return world.testDataContext;
};

const getAccountServicesPage = (world: CustomWorld): AccountServicesPage =>
  new AccountServicesPage(world.getPage());

const getAccountsOverviewPage = (world: CustomWorld): AccountsOverviewPage =>
  new AccountsOverviewPage(world.getPage());

const registerAndStayLoggedIn = async (
  world: CustomWorld,
  requestedProfile?: string
): Promise<void> => {
  const page = world.getPage();
  const loginPage = new LoginPage(page);
  const registrationPage = new RegistrationPage(page);
  const accountServicesPage = new AccountServicesPage(page);
  const dataContext = getOrCreateDataContext(world, requestedProfile);
  const registrationData = createRegistrationData(dataContext);

  world.journey.registrationData = registrationData;

  await loginPage.open();
  await loginPage.assertLoaded();
  await loginPage.openRegistrationPage();
  await registrationPage.assertLoaded();
  await registrationPage.registerCustomer(registrationData);
  await registrationPage.assertRegistrationSucceeded(registrationData.username);
  await accountServicesPage.assertWelcomeMessage(registrationData.username);
};

const openAdditionalSavingsAccount = async (world: CustomWorld): Promise<void> => {
  const accountServicesPage = getAccountServicesPage(world);
  const accountsOverviewPage = getAccountsOverviewPage(world);
  const openNewAccountPage = new OpenNewAccountPage(world.getPage());

  await accountServicesPage.openAccountsOverview();
  await accountsOverviewPage.assertLoaded();

  const accounts = await accountsOverviewPage.getAccounts();
  expect(accounts.length).toBeGreaterThan(0);

  world.journey.primaryAccountNumber = accounts[0].accountNumber;
  world.journey.accountNumbers = accounts.map((account) => account.accountNumber);

  await accountServicesPage.openNewAccount();
  await openNewAccountPage.assertLoaded();

  const savingsAccountNumber = await openNewAccountPage.openSavingsAccount(accounts[0].accountNumber);
  expect(savingsAccountNumber).toMatch(/^\d+$/);

  world.journey.savingsAccountNumber = savingsAccountNumber;
  world.journey.accountNumbers = [...new Set([...world.journey.accountNumbers, savingsAccountNumber])];
};

const ensureAtLeastTwoAccounts = async (world: CustomWorld): Promise<void> => {
  const accountServicesPage = getAccountServicesPage(world);
  const accountsOverviewPage = getAccountsOverviewPage(world);

  await accountServicesPage.openAccountsOverview();
  await accountsOverviewPage.assertLoaded();

  let accounts = await accountsOverviewPage.getAccounts();

  if (accounts.length < 2) {
    await openAdditionalSavingsAccount(world);
    await accountServicesPage.openAccountsOverview();
    await accountsOverviewPage.assertLoaded();
    accounts = await accountsOverviewPage.getAccounts();
  }

  expect(accounts.length).toBeGreaterThan(1);
  world.journey.accountNumbers = accounts.map((account) => account.accountNumber);
};

const transferGeneratedAmount = async (
  world: CustomWorld,
  requestedProfile?: string
): Promise<void> => {
  const dataContext = getOrCreateDataContext(world, requestedProfile);
  const accountServicesPage = getAccountServicesPage(world);
  const accountsOverviewPage = getAccountsOverviewPage(world);
  const transferFundsPage = new TransferFundsPage(world.getPage());

  await accountServicesPage.openAccountsOverview();
  await accountsOverviewPage.assertLoaded();

  const accounts = sortAccountsByBalanceDescending(await accountsOverviewPage.getAccounts());
  expect(accounts.length).toBeGreaterThan(1);

  const transferAmount = createTransferAmount(dataContext.profile);
  const sourceAccount = accounts.find((account) => account.balance > transferAmount);
  expect(sourceAccount).toBeDefined();

  const targetAccount = accounts.find(
    (account) => account.accountNumber !== sourceAccount!.accountNumber
  );

  expect(targetAccount).toBeDefined();

  world.journey.transferAmount = transferAmount;
  world.journey.primaryAccountNumber = sourceAccount!.accountNumber;
  world.journey.savingsAccountNumber = targetAccount!.accountNumber;

  await accountServicesPage.openTransferFunds();
  await transferFundsPage.assertLoaded();
  await transferFundsPage.transferFunds(
    transferAmount,
    sourceAccount!.accountNumber,
    targetAccount!.accountNumber
  );
};

const payBillWithGeneratedData = async (
  world: CustomWorld,
  requestedProfile?: string
): Promise<void> => {
  const dataContext = getOrCreateDataContext(world, requestedProfile);
  const accountServicesPage = getAccountServicesPage(world);
  const accountsOverviewPage = getAccountsOverviewPage(world);
  const billPayPage = new BillPayPage(world.getPage());

  await accountServicesPage.openAccountsOverview();
  await accountsOverviewPage.assertLoaded();

  const accounts = sortAccountsByBalanceDescending(await accountsOverviewPage.getAccounts());
  const fundingAccount = accounts[0];
  const billAmount = createBillAmount(dataContext.profile);

  expect(fundingAccount.balance).toBeGreaterThan(billAmount);

  const payee = createPayeeData(dataContext);

  world.journey.billPayee = payee;
  world.journey.billAmount = billAmount;
  world.journey.primaryAccountNumber = fundingAccount.accountNumber;

  await accountServicesPage.openBillPay();
  await billPayPage.assertLoaded();
  await billPayPage.makePayment(payee, billAmount, fundingAccount.accountNumber);
};

const reviewTransactionsForAllAccounts = async (world: CustomWorld): Promise<void> => {
  const accountServicesPage = getAccountServicesPage(world);
  const accountsOverviewPage = getAccountsOverviewPage(world);
  const accountActivityPage = new AccountActivityPage(world.getPage());

  await accountServicesPage.openAccountsOverview();
  await accountsOverviewPage.assertLoaded();

  const accounts = await accountsOverviewPage.getAccounts();
  expect(accounts.length).toBeGreaterThan(0);

  world.journey.accountNumbers = accounts.map((account) => account.accountNumber);

  for (const account of accounts) {
    await accountsOverviewPage.openAccountActivity(account.accountNumber);
    await accountActivityPage.assertLoaded(account.accountNumber);
    await accountActivityPage.assertTransactionsPresent();
    await accountServicesPage.openAccountsOverview();
    await accountsOverviewPage.assertLoaded();
  }
};

const updateContactInfoWithGeneratedData = async (world: CustomWorld): Promise<void> => {
  const dataContext = getOrCreateDataContext(world);
  const accountServicesPage = getAccountServicesPage(world);
  const updateContactInfoPage = new UpdateContactInfoPage(world.getPage());
  const updatedContactInfo = createUpdatedContactInfo(dataContext);

  world.journey.updatedContactInfo = updatedContactInfo;

  await accountServicesPage.openUpdateContactInfo();
  await updateContactInfoPage.assertLoaded();
  await updateContactInfoPage.updateContactInfo(updatedContactInfo);
};

const applyForGeneratedLoan = async (world: CustomWorld): Promise<void> => {
  const dataContext = getOrCreateDataContext(world);
  const accountServicesPage = getAccountServicesPage(world);
  const accountsOverviewPage = getAccountsOverviewPage(world);
  const requestLoanPage = new RequestLoanPage(world.getPage());

  await accountServicesPage.openAccountsOverview();
  await accountsOverviewPage.assertLoaded();

  const accounts = sortAccountsByBalanceDescending(await accountsOverviewPage.getAccounts());
  const fundingAccount = accounts[0];

  expect(fundingAccount.balance).toBeGreaterThan(75);

  const loanRequest = createLoanRequestData(fundingAccount.balance, dataContext.profile);
  world.journey.loanRequest = loanRequest;

  await accountServicesPage.openRequestLoan();
  await requestLoanPage.assertLoaded();

  const loanAccountNumber = await requestLoanPage.applyForLoan(
    loanRequest.amount,
    loanRequest.downPayment,
    fundingAccount.accountNumber
  );

  expect(loanAccountNumber).toMatch(/^\d+$/);
  world.journey.loanAccountNumber = loanAccountNumber;
};

Given("a newly registered customer is logged in to ParaBank", async function (this: CustomWorld) {
  await registerAndStayLoggedIn(this);
});

Given(
  "a newly registered customer is logged in to ParaBank using the {string} data profile",
  async function (this: CustomWorld, profile: string) {
    await registerAndStayLoggedIn(this, profile);
  }
);

When("the customer opens an additional savings account", async function (this: CustomWorld) {
  await openAdditionalSavingsAccount(this);
});

When("the customer logs out", async function (this: CustomWorld) {
  await getAccountServicesPage(this).logout();
});

When("the customer logs back in with the generated credentials", async function (this: CustomWorld) {
  const registrationData = this.journey.registrationData;
  expect(registrationData).toBeDefined();

  const loginPage = new LoginPage(this.getPage());

  await loginPage.assertLoaded();
  await loginPage.login(registrationData!.username, registrationData!.password);
});

Then(
  "the accounts overview should contain the accounts created for the customer",
  async function (this: CustomWorld) {
    const accountServicesPage = getAccountServicesPage(this);
    const accountsOverviewPage = getAccountsOverviewPage(this);

    await accountServicesPage.openAccountsOverview();
    await accountsOverviewPage.assertLoaded();

    const accounts = await accountsOverviewPage.getAccounts();
    expect(accounts.length).toBeGreaterThan(0);

    this.journey.accountNumbers = accounts.map((account) => account.accountNumber);

    await accountsOverviewPage.assertContainsAccount(this.journey.accountNumbers[0]);

    if (this.journey.savingsAccountNumber) {
      await accountsOverviewPage.assertContainsAccount(this.journey.savingsAccountNumber);
    }
  }
);

When("the customer ensures at least two accounts are available", async function (this: CustomWorld) {
  await ensureAtLeastTwoAccounts(this);
});

When(
  "the customer transfers a generated amount using the {string} data profile",
  async function (this: CustomWorld, profile: string) {
    await ensureAtLeastTwoAccounts(this);
    await transferGeneratedAmount(this, profile);
  }
);

When(
  "the customer pays a bill using the {string} data profile",
  async function (this: CustomWorld, profile: string) {
    await payBillWithGeneratedData(this, profile);
  }
);

Then(
  "the customer reviews the transactions for all available accounts",
  async function (this: CustomWorld) {
    await reviewTransactionsForAllAccounts(this);
  }
);

When(
  "the customer updates the contact information with generated data",
  async function (this: CustomWorld) {
    await updateContactInfoWithGeneratedData(this);
  }
);

Then(
  "the customer applies for a generated loan and receives a successful approval",
  async function (this: CustomWorld) {
    await applyForGeneratedLoan(this);
  }
);
