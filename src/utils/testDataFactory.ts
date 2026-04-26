import type {
  ContactInfoData,
  CustomerRegistrationData,
  LoanRequestData,
  PayeeData
} from "../models/bank";

const pick = <T>(values: readonly T[]): T => values[Math.floor(Math.random() * values.length)];

const randomDigits = (length: number): string =>
  Array.from({ length }, () => Math.floor(Math.random() * 10).toString()).join("");

const randomNumber = (minimum: number, maximum: number): number =>
  Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;

export const createRegistrationData = (): CustomerRegistrationData => {
  const states = ["TX", "CA", "FL", "WA", "NC"] as const;
  const cities = ["Austin", "Dallas", "Houston", "Raleigh", "Seattle"] as const;
  const timestamp = Date.now();

  return {
    firstName: `Auto${timestamp.toString().slice(-4)}`,
    lastName: "Customer",
    street: `${randomNumber(100, 999)} Cedar Street`,
    city: pick(cities),
    state: pick(states),
    zipCode: randomDigits(5),
    phoneNumber: `555${randomDigits(7)}`,
    ssn: randomDigits(9),
    username: `bdd${timestamp}`,
    password: `Pass${timestamp}!`
  };
};

export const createUpdatedContactInfo = (): ContactInfoData => {
  const streets = ["Maple Avenue", "Oak Lane", "Pine Road", "River Drive"] as const;
  const cities = ["Phoenix", "Denver", "Atlanta", "Boston"] as const;
  const states = ["AZ", "CO", "GA", "MA"] as const;

  return {
    firstName: `Updated${randomDigits(3)}`,
    lastName: `User${randomDigits(2)}`,
    street: `${randomNumber(200, 999)} ${pick(streets)}`,
    city: pick(cities),
    state: pick(states),
    zipCode: randomDigits(5),
    phoneNumber: `555${randomDigits(7)}`
  };
};

export const createPayeeData = (): PayeeData => {
  const vendors = ["Electric Utility", "Water Works", "City Gas", "Internet Provider"] as const;

  return {
    name: `${pick(vendors)} ${randomDigits(2)}`,
    street: `${randomNumber(100, 999)} Billing Road`,
    city: "Plano",
    state: "TX",
    zipCode: randomDigits(5),
    phoneNumber: `555${randomDigits(7)}`,
    accountNumber: randomDigits(9)
  };
};

export const createBillAmount = (): number => randomNumber(25, 100);

export const createLoanRequestData = (availableBalance: number): LoanRequestData => {
  const maxAllowedDownPayment = Math.min(100, Math.max(50, Math.floor(availableBalance - 25)));
  const downPayment = Math.max(50, maxAllowedDownPayment);

  return {
    amount: randomNumber(300, 900),
    downPayment
  };
};
