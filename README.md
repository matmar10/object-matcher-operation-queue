# object-matcher-operation-queue

Match an object to a list of operations based on a YAML configuration, and then execute them in sequential order, passing the result to each subsequent operation.

Based on [object-matcher](https://github.com/simonfan/object-matcher).

**See the `test/` directory for examples**  

## Installation

```
npm install --save object-matcher-operation-queue
```

## Example Usage

### In Configuration

```
---
- criteria:
    sourceAccountCurrency: USD
    targetAccountCurrency: MYR
  operation:
    - name:                apply fee
      options:
        type:              percent
        value:             20
        on:                source
```

### In Code
```
const matcher = new ObjectOperationMatcher('path to yml file', {
  // hash of operation names => callback
  'apply fee' => (options, transaction, previousResult) {
    transaction.feeAmount = transaction.sourceAmount * (options.value / 100);
    if ('source' === options.on) {
      transaction.feeCurrency = transaction.sourceAccountCurrency;  
    } else {
      transaction.feeCurrency = transaction.targetAccountCurrency;  
    }
  }
});
```

## Registering Operations

Registering an operation makes it available for use within
criteria matched configurations by name:

```
matcher.operation('give discount', (options, transaction, previousResult) => {
  // do something to give a discount
});
```

As an example, this would allow the following in config:

```
---
- criteria:
    sourceAccountCurrency: USD
    targetAccountCurrency: MYR
  operation:
    - name:                give discount
      options:
        amount:            10
```
