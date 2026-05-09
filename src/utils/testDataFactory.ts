import { randomInt, randomUUID } from "node:crypto";

import type {
  ContactInfoData,
  CustomerRegistrationData,
  LoanRequestData,
  PayeeData,
  ScenarioDataContext,
  TestDataProfile
} from "../models/bank";

const pick = <T>(values: readonly T[]): T => values[Math.floor(Math.random() * values.length)];

const randomDigits = (length: number): string =>
  Array.from({ length }, () => Math.floor(Math.random() * 10).toString()).join("");

const randomNumber = (minimum: number, maximum: number): number =>
  randomInt(minimum, maximum + 1);

export const defaultTestDataProfile: TestDataProfile = "retail";

const profileCatalog = {
  retail: {
    firstNamePrefix: "Retail",
    cityPool: ["Austin", "Dallas", "Houston", "Raleigh", "Seattle"] as const,
    statePool: ["TX", "CA", "FL", "WA", "NC"] as const,
    payeePool: ["Electric Utility", "Water Works", "City Gas", "Internet Provider"] as const,
    billRange: [25, 90] as const,
    transferRange: [60, 140] as const,
    loanRange: [300, 700] as const
  },
  premium: {
    firstNamePrefix: "Premium",
    cityPool: ["Boston", "Chicago", "Denver", "Phoenix", "San Diego"] as const,
    statePool: ["MA", "IL", "CO", "AZ", "CA"] as const,
    payeePool: ["Mortgage Services", "Private Utility", "Investment Funding", "Concierge Internet"] as const,
    billRange: [80, 180] as const,
    transferRange: [120, 240] as const,
    loanRange: [650, 950] as const
  },
  student: {
    firstNamePrefix: "Student",
    cityPool: ["Tempe", "Madison", "Columbus", "Ann Arbor", "Chapel Hill"] as const,
    statePool: ["AZ", "WI", "OH", "MI", "NC"] as const,
    payeePool: ["Campus Housing", "Student Internet", "Book Store", "Transit Pass"] as const,
    billRange: [20, 75] as const,
    transferRange: [40, 110] as const,
    loanRange: [250, 550] as const
  }
} as const;

const sanitizeIdentifier = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 16);

export const createScenarioDataContext = (
  scenarioName: string,
  profile: TestDataProfile = defaultTestDataProfile
): ScenarioDataContext => {
  const runId = process.env.TEST_RUN_ID ?? `local-${Date.now()}`;
  const workerId = process.env.CUCUMBER_WORKER_ID ?? "0";
  const scenarioKey = sanitizeIdentifier(scenarioName || "customer-scenario");
  const uniqueId = `${profile}-${workerId}-${scenarioKey}-${randomUUID().slice(0, 8)}`;

  return {
    profile,
    runId,
    workerId,
    scenarioKey,
    uniqueId
  };
};

export const createRegistrationData = (
  dataContext: ScenarioDataContext
): CustomerRegistrationData => {
  const profileData = profileCatalog[dataContext.profile];
  const uniqueSuffix = dataContext.uniqueId.replace(/[^a-z0-9]/g, "").slice(-10);

  return {
    firstName: `${profileData.firstNamePrefix}${uniqueSuffix.slice(-4)}`,
    lastName: `Customer${dataContext.workerId}`,
    street: `${randomNumber(100, 999)} Cedar Street`,
    city: pick(profileData.cityPool),
    state: pick(profileData.statePool),
    zipCode: randomDigits(5),
    phoneNumber: `555${randomDigits(7)}`,
    ssn: randomDigits(9),
    username: `bdd_${uniqueSuffix}`,
    password: `Pass_${uniqueSuffix}!`
  };
};

export const createUpdatedContactInfo = (
  dataContext: ScenarioDataContext
): ContactInfoData => {
  const profileData = profileCatalog[dataContext.profile];
  const streets = ["Maple Avenue", "Oak Lane", "Pine Road", "River Drive"] as const;

  return {
    firstName: `${profileData.firstNamePrefix}Updated${randomDigits(2)}`,
    lastName: `User${dataContext.workerId}${randomDigits(1)}`,
    street: `${randomNumber(200, 999)} ${pick(streets)}`,
    city: pick(profileData.cityPool),
    state: pick(profileData.statePool),
    zipCode: randomDigits(5),
    phoneNumber: `555${randomDigits(7)}`
  };
};

export const createPayeeData = (dataContext: ScenarioDataContext): PayeeData => {
  const profileData = profileCatalog[dataContext.profile];

  return {
    name: `${pick(profileData.payeePool)} ${randomDigits(2)}`,
    street: `${randomNumber(100, 999)} Billing Road`,
    city: "Plano",
    state: "TX",
    zipCode: randomDigits(5),
    phoneNumber: `555${randomDigits(7)}`,
    accountNumber: randomDigits(9)
  };
};

export const createBillAmount = (
  profile: TestDataProfile = defaultTestDataProfile
): number => {
  const [minimum, maximum] = profileCatalog[profile].billRange;
  return randomNumber(minimum, maximum);
};

export const createTransferAmount = (
  profile: TestDataProfile = defaultTestDataProfile
): number => {
  const [minimum, maximum] = profileCatalog[profile].transferRange;
  return randomNumber(minimum, maximum);
};

export const createLoanRequestData = (
  availableBalance: number,
  profile: TestDataProfile = defaultTestDataProfile
): LoanRequestData => {
  const [minimum, maximum] = profileCatalog[profile].loanRange;
  const maxAllowedDownPayment = Math.min(100, Math.max(50, Math.floor(availableBalance - 25)));
  const downPayment = Math.max(50, maxAllowedDownPayment);

  return {
    amount: randomNumber(minimum, maximum),
    downPayment
  };
};
