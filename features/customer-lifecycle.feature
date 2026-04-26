@customer-journey
Feature: ParaBank customer lifecycle
  As a newly registered ParaBank customer
  I want to complete key banking activities
  So that I can validate the full customer journey

  @smoke
  Scenario: Register, transact, update profile, and request a loan
    Given a customer registers and opens a new savings account
    When the customer logs in again with the newly created credentials
    Then the accounts overview should contain the accounts created during registration
    When the customer ensures at least two accounts are available
    And the customer transfers 150 dollars between two accounts
    And the customer pays a bill from one of the available accounts
    Then the customer reviews the transactions for all available accounts and attaches screenshots to the report
    When the customer updates the contact information with random data
    Then the customer applies for a loan and receives a successful approval
