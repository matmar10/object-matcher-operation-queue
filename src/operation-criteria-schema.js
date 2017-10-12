'use strict';

module.exports = {

  anyOf: [{
    $ref: '#/definitions/MultiOperationCriteria'
  }, {
    $ref: '#/definitions/SingleOperationCriteria'
  }],

  definitions: {

    SingleOperationCriteria: {
      type: 'object',
      required: ['criteria', 'operation'],
      properties: {
        criteria: { $ref: '#/definitions/Criteria' },
        operation: { $ref: '#/definitions/Operation' }
      }
    },

    MultiOperationCriteria: {
      type: 'object',
      required: ['criteria', 'operations'],
      properties: {
        criteria: { $ref: '#/definitions/Criteria' },
        operations: { $ref: '#/definitions/OperationList' }
      }
    },

    Criteria: {
      type: 'object',
      properties: {}
    },

    Operation: {
      type: 'object',
      required: ['name', 'options'],
      properties: {
        name: {
          type: 'string'
        },
        options: {
          type: 'object'
        }
      }
    },

    OperationList: {
      type: 'array',
      items: { $ref: '#/definitions/Operation' }
    }
  }
};
