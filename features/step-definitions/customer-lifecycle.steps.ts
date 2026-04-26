import { expect } from "@playwright/test";
import * as allure from "allure-js-commons";

import type { AccountSummary } from "../../src/models/bank";
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
  createUpdatedContactInfo
} from "../../src/utils/testDataFactory";
import { Given, Then, When } from "@cucumber/cucumber";
import { CustomWorld } from "../support/world";

const sortAccountsByBalanceDescending = (accounts: AccountSummary[]): AccountSummary[] =>
  [...accounts].sort((left, right) => right.balance - left.balance);

Given("a customer registers and opens a new savings account", async function (this: CustomWorld) {
  const page = this.getPage();
  const loginPage = new LoginPage(page);
  const registrationPage = new RegistrationPage(page);
  const accountServicesPage = new AccountServicesPage(page);
  const accountsOverviewPage = new AccountsOverviewPage(page);
  const openNewAccountPage = new OpenNewAccountPage(page);

  const registrationData = createRegistrationData();
  this.journey.registrationData = registrationData;

  await allure.step("Create a brand-new ParaBank customer and capture the generated credentials", async (stepContext) => {
    await stepContext.parameter("username", registrationData.username);
    await stepContext.parameter("password", "masked", "masked");

    await loginPage.open();
    await loginPage.assertLoaded();
    await loginPage.openRegistrationPage();
    await registrationPage.assertLoaded();
    await registrationPage.registerCustomer(registrationData);
    await registrationPage.assertRegistrationSucceeded(registrationData.username);
    await accountServicesPage.assertWelcomeMessage(registrationData.username);
  });

  await accountServicesPage.openAccountsOverview();
  await accountsOverviewPage.assertLoaded();

  const initialAccounts = await accountsOverviewPage.getAccounts();
  expect(initialAccounts.length).toBeGreaterThan(0);

  this.journey.primaryAccountNumber = initialAccounts[0].accountNumber;
  this.journey.accountNumbers = [initialAccounts[0].accountNumber];

  await accountServicesPage.openNewAccount();
  await openNewAccountPage.assertLoaded();

  const savingsAccountNumber = await openNewAccountPage.openSavingsAccount(
    initialAccounts[0].accountNumber
  );

  expect(savingsAccountNumber).toMatch(/^\d+$/);

  this.journey.savingsAccountNumber = savingsAccountNumber;
  this.journey.accountNumbers.push(savingsAccountNumber);

  await accountServicesPage.logout();
});

When("the customer logs in again with the newly created credentials", async function (this: CustomWorld) {
  const registrationData = this.journey.registrationData;
  expect(registrationData).toBeDefined();

  const loginPage = new LoginPage(this.getPage());

  await allure.step("Log in again with the newly registered credentials", async (stepContext) => {
    await stepContext.parameter("username", registrationData!.username);
    await stepContext.parameter("password", "masked", "masked");

    await loginPage.assertLoaded();
    await loginPage.login(registrationData!.username, registrationData!.password);
  });
});

Then(
  "the accounts overview should contain the accounts created during registration",
  async function (this: CustomWorld) {
    const accountServicesPage = new AccountServicesPage(this.getPage());
    const accountsOverviewPage = new AccountsOverviewPage(this.getPage());

    await accountServicesPage.openAccountsOverview();
    await accountsOverviewPage.assertLoaded();

    await accountsOverviewPage.assertContainsAccount(this.journey.primaryAccountNumber!);
    await accountsOverviewPage.assertContainsAccount(this.journey.savingsAccountNumber!);

    const accounts = await accountsOverviewPage.getAccounts();
    this.journey.accountNumbers = accounts.map((account) => account.accountNumber);
  }
);

When("the customer ensures at least two accounts are available", async function (this: CustomWorld) {
  const accountServicesPage = new AccountServicesPage(this.getPage());
  const accountsOverviewPage = new AccountsOverviewPage(this.getPage());
  const openNewAccountPage = new OpenNewAccountPage(this.getPage());

  await accountServicesPage.openAccountsOverview();
  await accountsOverviewPage.assertLoaded();

  let accounts = await accountsOverviewPage.getAccounts();

  await allure.step("Ensure that at least two accounts are available for transactions", async () => {
    if (accounts.length > 1) {
      return;
    }

    await accountServicesPage.openNewAccount();
    await openNewAccountPage.assertLoaded();

    const newAccountNumber = await openNewAccountPage.openSavingsAccount(accounts[0].accountNumber);

    expect(newAccountNumber).toMatch(/^\d+$/);

    if (!this.journey.savingsAccountNumber) {
      this.journey.savingsAccountNumber = newAccountNumber;
    }
  });

  await accountServicesPage.openAccountsOverview();
  await accountsOverviewPage.assertLoaded();
  accounts = await accountsOverviewPage.getAccounts();

  expect(accounts.length).toBeGreaterThan(1);
  this.journey.accountNumbers = accounts.map((account) => account.accountNumber);
});

When("the customer transfers {int} dollars between two accounts", async function (this: CustomWorld, amount: number) {
  const accountServicesPage = new AccountServicesPage(this.getPage());
  const accountsOverviewPage = new AccountsOverviewPage(this.getPage());
  const transferFundsPage = new TransferFundsPage(this.getPage());

  await accountServicesPage.openAccountsOverview();
  await accountsOverviewPage.assertLoaded();

  const accounts = sortAccountsByBalanceDescending(await accountsOverviewPage.getAccounts());
  expect(accounts.length).toBeGreaterThan(1);
  expect(accounts[0].balance).toBeGreaterThan(amount);

  const sourceAccount = accounts[0];
  const targetAccount = accounts.find(
    (account) => account.accountNumber !== sourceAccount.accountNumber
  );

  expect(targetAccount).toBeDefined();

  this.journey.transferAmount = amount;
  this.journey.primaryAccountNumber = sourceAccount.accountNumber;
  this.journey.savingsAccountNumber = targetAccount!.accountNumber;

  await accountServicesPage.openTransferFunds();
  await transferFundsPage.assertLoaded();
  await transferFundsPage.transferFunds(amount, sourceAccount.accountNumber, targetAccount!.accountNumber);
});

When("the customer pays a bill from one of the available accounts", async function (this: CustomWorld) {
  const accountServicesPage = new AccountServicesPage(this.getPage());
  const accountsOverviewPage = new AccountsOverviewPage(this.getPage());
  const billPayPage = new BillPayPage(this.getPage());

  await accountServicesPage.openAccountsOverview();
  await accountsOverviewPage.assertLoaded();

  const accounts = sortAccountsByBalanceDescending(await accountsOverviewPage.getAccounts());
  const fundingAccount = accounts[0];

  expect(fundingAccount.balance).toBeGreaterThan(100);

  const payee = createPayeeData();
  const billAmount = createBillAmount();

  this.journey.billPayee = payee;
  this.journey.billAmount = billAmount;
  this.journey.primaryAccountNumber = fundingAccount.accountNumber;

  await allure.step("Generate random payee details for the bill payment", async (stepContext) => {
    await stepContext.parameter("payee", payee.name);
    await stepContext.parameter("billAmount", billAmount.toString());
  });

  await accountServicesPage.openBillPay();
  await billPayPage.assertLoaded();
  await billPayPage.makePayment(payee, billAmount, fundingAccount.accountNumber);
});

Then(
  "the customer reviews the transactions for all available accounts and attaches screenshots to the report",
  async function (this: CustomWorld) {
    const accountServicesPage = new AccountServicesPage(this.getPage());
    const accountsOverviewPage = new AccountsOverviewPage(this.getPage());
    const accountActivityPage = new AccountActivityPage(this.getPage());

    await accountServicesPage.openAccountsOverview();
    await accountsOverviewPage.assertLoaded();

    const accounts = await accountsOverviewPage.getAccounts();
    expect(accounts.length).toBeGreaterThan(1);

    this.journey.accountNumbers = accounts.map((account) => account.accountNumber);

    for (const account of accounts) {
      await accountsOverviewPage.openAccountActivity(account.accountNumber);
      await accountActivityPage.assertLoaded(account.accountNumber);
      await accountActivityPage.assertTransactionsPresent();
      await accountActivityPage.attachScreenshot(account.accountNumber);
      await accountServicesPage.openAccountsOverview();
      await accountsOverviewPage.assertLoaded();
    }
  }
);

When("the customer updates the contact information with random data", async function (this: CustomWorld) {
  const accountServicesPage = new AccountServicesPage(this.getPage());
  const updateContactInfoPage = new UpdateContactInfoPage(this.getPage());

  const updatedContactInfo = createUpdatedContactInfo();
  this.journey.updatedContactInfo = updatedContactInfo;

  await allure.step("Generate random customer contact details for the profile update", async (stepContext) => {
    await stepContext.parameter("updatedCity", updatedContactInfo.city);
    await stepContext.parameter("updatedState", updatedContactInfo.state);
  });

  await accountServicesPage.openUpdateContactInfo();
  await updateContactInfoPage.assertLoaded();
  await updateContactInfoPage.updateContactInfo(updatedContactInfo);
});

Then("the customer applies for a loan and receives a successful approval", async function (this: CustomWorld) {
  const accountServicesPage = new AccountServicesPage(this.getPage());
  const accountsOverviewPage = new AccountsOverviewPage(this.getPage());
  const requestLoanPage = new RequestLoanPage(this.getPage());

  await accountServicesPage.openAccountsOverview();
  await accountsOverviewPage.assertLoaded();

  const accounts = sortAccountsByBalanceDescending(await accountsOverviewPage.getAccounts());
  const fundingAccount = accounts[0];

  expect(fundingAccount.balance).toBeGreaterThan(75);

  const loanRequest = createLoanRequestData(fundingAccount.balance);
  this.journey.loanRequest = loanRequest;

  await allure.step("Generate loan request values that fit the available account balance", async (stepContext) => {
    await stepContext.parameter("loanAmount", loanRequest.amount.toString());
    await stepContext.parameter("downPayment", loanRequest.downPayment.toString());
  });

  await accountServicesPage.openRequestLoan();
  await requestLoanPage.assertLoaded();

  const loanAccountNumber = await requestLoanPage.applyForLoan(
    loanRequest.amount,
    loanRequest.downPayment,
    fundingAccount.accountNumber
  );

  expect(loanAccountNumber).toMatch(/^\d+$/);
  this.journey.loanAccountNumber = loanAccountNumber;
});
