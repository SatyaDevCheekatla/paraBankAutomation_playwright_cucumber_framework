@customer-journey
Feature: ParaBank customer lifecycle and banking workflows
  As a ParaBank customer
  I want the major digital banking journeys to be validated
  So that the framework covers realistic end-to-end business use cases

  @smoke @parallel-safe
  Scenario: Customer completes the full lifecycle workflow
    Given a newly registered customer is logged in to ParaBank
    When the customer opens an additional savings account
    And the customer logs out
    And the customer logs back in with the generated credentials
    Then the accounts overview should contain the accounts created for the customer
    When the customer ensures at least two accounts are available
    And the customer transfers a generated amount using the "retail" data profile
    And the customer pays a bill using the "retail" data profile
    Then the customer reviews the transactions for all available accounts
    When the customer updates the contact information with generated data
    Then the customer applies for a generated loan and receives a successful approval

  @regression @parallel-safe @data-driven
  Scenario Outline: Customer can execute core money-movement flows with <profile> data
    Given a newly registered customer is logged in to ParaBank using the "<profile>" data profile
    When the customer opens an additional savings account
    And the customer ensures at least two accounts are available
    And the customer transfers a generated amount using the "<profile>" data profile
    And the customer pays a bill using the "<profile>" data profile
    Then the customer reviews the transactions for all available accounts

    Examples:
      | profile |
      | retail  |
      | premium |
      | student |

  @regression @parallel-safe
  Scenario: Customer can update the profile with dynamic data and request a loan
    Given a newly registered customer is logged in to ParaBank
    When the customer updates the contact information with generated data
    Then the customer applies for a generated loan and receives a successful approval
