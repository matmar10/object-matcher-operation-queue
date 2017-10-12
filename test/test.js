'use strict';

const Promise = require('bluebird');
const errors = require('common-errors');

const chai = require('chai');

/* jshint -W030 */

describe('ObjectOperationMatcher', function () {

  it('is an object', function () {
    const ObjectOperationMatcher = require('./../src');
    chai.expect(ObjectOperationMatcher).to.be.an('function');
  });

  it('requires a path to configuration', function () {
    const ObjectOperationMatcher = require('./../src');
    chai.expect(() => {
      new ObjectOperationMatcher();
    }).to.throw(Error);
  });

  it('throws error for invalid hash of methods', function () {
    const ObjectOperationMatcher = require('./../src');
    chai.expect(() => {
      new ObjectOperationMatcher(__dirname + '/fixtures/fees.yml', {
        'foo': 'bar'
      });
    }).to.throw(Error);
  });

  it('accepts a hash of methods', function () {
    const ObjectOperationMatcher = require('./../src');
    new ObjectOperationMatcher(__dirname + '/fixtures/fees.yml', {
      'foo': function () {}
    });
  });

  describe('assertValidCriteria', function () {
    it('rejects criteria not matching schema', function () {
      const ObjectOperationMatcher = require('./../src');
      try {
        ObjectOperationMatcher.assertValidCriteria({
          foo: 'bar'
        });
      } catch (err) {
        chai.expect(err.message).to.equal('should have required property \'criteria\'');
      }
    });
    it('accepts criteria matching schema', function () {
      const ObjectOperationMatcher = require('./../src');
      try {
        ObjectOperationMatcher.assertValidCriteria({
          criteria: {
            foo: 'bar',
          },
          operations: []
        });
      } catch (err) {
        chai.expect(err.message).to.equal('should have required property \'criteria\'');
      }
    });
  });

  describe('operation()', function () {
    it('rejects invalid callback', function () {
      const ObjectOperationMatcher = require('./../src');
      const o = new ObjectOperationMatcher(__dirname + '/fixtures/fees.yml');
      chai.expect(() => {
        o.operation('foo', 'bar');
      }).to.throw(Error);
    });
    it('accepts valid callback', function () {
      const ObjectOperationMatcher = require('./../src');
      const o = new ObjectOperationMatcher(__dirname + '/fixtures/fees.yml');
      chai.expect(() => {
        o.operation('foo', function () {});
      }).to.not.throw(Error);
    });
    it('throws OperationNotSupported for unregistered operation name', function () {
      const ObjectOperationMatcher = require('./../src');
      const o = new ObjectOperationMatcher(__dirname + '/fixtures/fees.yml');
      chai.expect(() => {
        o.operation('foo');
      }).to.throw(errors.OperationNotSupported);
    });
    it('returns callback for registered operation name', function () {
      const ObjectOperationMatcher = require('./../src');
      const o = new ObjectOperationMatcher(__dirname + '/fixtures/fees.yml');
      const fn = function () {};
      o.operation('foo', fn);
      chai.expect(() => {
        const gotFn = o.operation('foo');
        chai.expect(gotFn).to.equal(fn);
      }).to.not.throw(errors.OperationNotSupported);
    });
  });

  describe('ready()', function () {
    it('returns rejected promise for invalid path', function (done) {
      const ObjectOperationMatcher = require('./../src');
      const o = new ObjectOperationMatcher('not-real-file.yml');
      const ready = o.ready();
      chai.expect(ready).to.be.an.instanceOf(Promise);
      ready.then(null, (err) => {
        chai.expect(err).to.be.an.instanceOf(Error);
        done();
      });
    });
    it('returns resolved promise for vaid path', function (done) {
      const ObjectOperationMatcher = require('./../src');
      const o = new ObjectOperationMatcher(__dirname + '/fixtures/fees.yml');
      const ready = o.ready();
      chai.expect(ready).to.be.an.instanceOf(Promise);
      ready.then(function () {
        done();
      }, done);
    });
  });

  describe('match()', function () {
    it('returns empty array for no matches', function (done) {
      const ObjectOperationMatcher = require('./../src');
      const o = new ObjectOperationMatcher(__dirname + '/fixtures/simple.yml', {
        'say hello': () => {},
        'say goodbye': () => {}
      });
      o.ready()
        .then(() => {
          return o.match({
            name: 'Donald Trump',
            team: 'front end'
          });
        })
        .then((result) => {
          chai.expect(result).to.be.an.instanceOf(Array);
          chai.expect(result.length).to.equal(0);
          done();
        }, done);
    });
    it('returns array of callbacks for matches', function (done) {
      const ObjectOperationMatcher = require('./../src');
      const sayHello = () => {};
      const sayGoodbye = () => {};
      const sayNiceThing = () => {};

      const o = new ObjectOperationMatcher(__dirname + '/fixtures/simple.yml', {
        'say hello': sayHello,
        'say goodbye': sayGoodbye,
        'say nice thing': sayNiceThing
      });
      o.ready()
        .then(() => {
          return o.match({
            name: 'Matthew',
            team: 'front end'
          });
        })
        .then((result) => {
          chai.expect(result).to.be.an.instanceOf(Array);
          // three operations for two matched criteria
          chai.expect(result.length).to.equal(3);
          chai.expect(result[0]).to.be.a('function');
          chai.expect(result[0].operationName).to.equal('say hello');
          chai.expect(result[1]).to.be.a('function');
          chai.expect(result[1].operationName).to.equal('say goodbye');
          chai.expect(result[2]).to.be.a('function');
          chai.expect(result[2].operationName).to.equal('say nice thing');
        })
        .then(done, done);
    });
  });

  describe('execute()', function () {
    it('executes all operations in order for matched criteria', function (done) {
      const ObjectOperationMatcher = require('./../src');

      const said = [];

      const sayHello = (options, transaction, prevResult) => {
        said.push('sayHello: ' + options.message + transaction.name);
        prevResult += 'said hello, ';
        return prevResult;
      };
      const sayGoodbye = (options, transaction, prevResult) => {
        said.push('sayGoodbye: ' + options.message + transaction.name);
        prevResult += 'said goodbye, ';
        return prevResult;
      };
      const sayNiceThing = (options, transaction, prevResult) => {
        said.push('sayNiceThing: ' + options.message + transaction.name);
        prevResult += 'said nice thing, ';
        return prevResult;
      };

      const o = new ObjectOperationMatcher(__dirname + '/fixtures/simple.yml', {
        'say hello': sayHello,
        'say goodbye': sayGoodbye,
        'say nice thing': sayNiceThing
      });

      o.ready()
        .then(() => {
          return o.execute({
            name: 'Matthew',
            team: 'front end'
          }, '');
        })
        .then((result) => {
          chai.expect(result).to.equal('said hello, said goodbye, said nice thing, ');
          chai.expect(said[0]).to.equal('sayHello: Hello, Matthew');
          chai.expect(said[1]).to.equal('sayGoodbye: Goodbye, Matthew');
          chai.expect(said[2]).to.equal('sayNiceThing: I love you, Matthew');
        })
        .then(done, done);
    });
  });

});
