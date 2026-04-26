export interface CustomerRegistrationData {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  ssn: string;
  username: string;
  password: string;
}

export interface ContactInfoData {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
}

export interface PayeeData {
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  accountNumber: string;
}

export interface LoanRequestData {
  amount: number;
  downPayment: number;
}

export interface AccountSummary {
  accountNumber: string;
  balance: number;
  availableAmount: number;
}

export interface CustomerJourneyState {
  registrationData?: CustomerRegistrationData;
  updatedContactInfo?: ContactInfoData;
  billPayee?: PayeeData;
  primaryAccountNumber?: string;
  savingsAccountNumber?: string;
  loanAccountNumber?: string;
  accountNumbers: string[];
  transferAmount?: number;
  billAmount?: number;
  loanRequest?: LoanRequestData;
}
