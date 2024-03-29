'use strict';

const assert = require('assert');
const errors = require('common-errors');
const buildObjectMatcher = require('object-matcher');
const jsYaml = require('js-yaml');
const Ajv = require('ajv');

const ajv = new Ajv();
const operationCriteriaSchema = require('./operation-criteria-schema');
const validateOperationCriteriaItem = ajv.compile(operationCriteriaSchema);

const fs = require('fs');
const Promise = require('bluebird');
const readFileAsync = Promise.promisify(fs.readFile);


class ObjectOperationMatcher {

  /**
   * Create a new object operation matcher instance
   * @param  {string} pathToOperationCriteria      Filename to look up the list of criteria and ops
   * @param  {object<string,function>} operations  Hash of operation names and callbacks
   * @return {ObjectOperationMatcher}
   */
  constructor(pathToOperationCriteria, operations) {

    assert(pathToOperationCriteria, 'Requires `pathToOperationCriteria`');

    this._operationCriteriaList = [];
    this._matchers = [];

    // operation name => function
    this._operations = {};

    this._ready = readFileAsync(pathToOperationCriteria)
      .then((fileContent) => {
        this._operationCriteriaList = jsYaml.safeLoad(fileContent);
        this._matchers = this._operationCriteriaList.map((operationCriteria) => {
          // TODO: schema is not working
          ObjectOperationMatcher.assertValidCriteria(operationCriteria);
          return buildObjectMatcher(operationCriteria.criteria);
        });
      });

    operations = operations || {};
    for (let opName in operations) {
      this.operation(opName, operations[opName]);
    }
  }

  static assertValidCriteria(operationCriteria) {
    if (validateOperationCriteriaItem(operationCriteria)) {
      return;
    }
    throw validateOperationCriteriaItem.errors[0];
  }

  /**
   * Get or set an operation by name
   * @param  {string}   name  The operation name
   * @param  {function} fn    The operation callback
   * @return {function}       The operation identified by the name provided
   */
  operation(name, fn) {

    assert(name, 'Requires argument `name`');

    // setter
    if (fn) {
      assert('function' === typeof fn, 'Argument `fn` must be a function');
      this._operations[name] = fn;
    }

    // getter
    if (!this._operations[name]) {
      throw new errors.NotSupportedError(`${name} is not supported or is unregisted (did you register it?)`);
    }
    return this._operations[name];
  }

  /**
   * Get list of matching criteria for this transaction
   * @param  {object} transaction  A DinarPal transaction object
   * @return {array<object>}       List of matching criteria and operations
   */
  match(transaction) {
    const matchingOperations = [];
    this._matchers.forEach((isMatchForOperation, i) => {
      if (!isMatchForOperation(transaction)) {
        return;
      }

      const operationAndCriteria = this._operationCriteriaList[i];

      const buildCallback = (name, options, fn) => {
        const cb = fn.bind(fn, options);
        cb.operationName = name;
        return cb;
      };

      // assign the callback functions with the parameters required
      const addOperations = (operation) => {
        if (Array.isArray(operation)) {
          operation.forEach(addOperations);
          return;
        }

        if (!operation) {
          return;
        }

        if ('string' === typeof operation) {
          const fn = buildCallback(operation, {}, this.operation(operation));
          matchingOperations.push(fn);
          return;
        }

        if ('object' === typeof operation) {
          const fn = buildCallback(operation.name,  operation.options, this.operation(operation.name));
          matchingOperations.push(fn);
          return;
        }

        throw new errors.NotSupportedError('Invalid operation configuration.');
      };

      addOperations(operationAndCriteria.operation || operationAndCriteria.operations);
    });
    return matchingOperations;
  }

  /**
   * Execute all matched trans
   *
   */
  /**
   * [execute description]
   * @param  {object} obj        The object to start the processing chain on
   * @param  {*} initialValue    (optional) The initial value to be passed to the first matched operation
   * @return {*}                 The resulting value from all operations
   */
  execute(obj, initialValue) {
    const matchedFns = this.match(obj);
    return Promise.reduce(matchedFns, (prevResult, fn) => {
      return fn(obj, prevResult);
    }, initialValue);
  }

  ready() {
    return this._ready;
  }
}

module.exports = ObjectOperationMatcher;
