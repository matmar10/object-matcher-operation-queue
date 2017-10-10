'use strict';

module.exports = [{
  sourceExternalAccountType: 'debit card',
  destinationAccountType: 'fiat',
  destinationCurrency: 'MYR',
  sourceAmount: 10000000
}, {
  sourceAccountType: 'fiat',
  sourceAccountCurrency: 'MYR',
  targetAccountType: 'allocated',
  targetAccountCurrency: 'XAU',
  sourceAmount: 20000000
}, {
  sourceAccountType: 'fiat',
  sourceAccountCurrency: 'MYR',
  externalTargetAccountType: 'withdrawal',
  targetAccountCurrency: 'XAU',
  inventorySKU: '249-230',
  sourceAmount: 100000000
}];
