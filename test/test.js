'use strict';

const Promise = require('bluebird');
const transactions = require('./fixtures/transactions');
const ObjectOperationMatcher = require('./../');

let totalFees = 0;
let feeList = [];

const matcher = new ObjectOperationMatcher(__dirname + '/fixtures/fees.yml', {
  'apply fee': (options, transaction, previousResult) => {
    previousResult = previousResult || 0;

    console.log('calculate fee using');
    console.log('----');
    console.log(options);
    console.log(transaction);
    console.log('Previous result was:', previousResult);

    let result = 0;
    switch (options.type) {
      case 'fixed':
        result = transaction.amount + options.value;
        break;
      case 'percent':
        result = transaction.amount * options.value;
        break;
    }

    totalFees += result;
    feeList.push({
      type: options.type,
      on: options.on,
      value: options.value,
      amount: result,
      currency: ('source' === options.on) ?
        (transaction.sourceAccountCurrency || transaction.sourceExternalAccountCurrency) :
        (transaction.destinationAccountCurrency || transaction.destinationExternalAccountCurrency)
    });
    return result;
  }
});

matcher.ready()
  .then(() => {
    return Promise.each(transactions, (trxn) => {
      return matcher.execute(trxn);
    });
  })
  .then(() => {
    console.log('Total fees are:', totalFees);
    console.log('Fee list is:', feeList);
  });
