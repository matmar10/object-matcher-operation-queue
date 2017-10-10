'use strict';

module.exports = {
  type: 'object',
  anyOf: [{
    required: ['criteria', 'operations']
  }],
  properties: {
    criteria: {
      type: 'object'
    },
    operation: {
      $ref: '#/definitions/Operation'
    },
    operations: {
      $ref: '#/definitions/OperationList'
    }
  },
  definitions: {
    OperationList: {
      type: 'array',
      items: {
        $ref: '#/definitions/Operation'
      }
    },
    Operation: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          enum: ['apply fee']
        },
        options: {
          type: 'object',
          required: ['type', 'value', 'on'],
          oneOf: [{
            properties: {
              type: {
                type: 'string',
                enum: ['fixed']
              },
              value: {
                type: 'integer'
              },
              on: ['source', 'target']
            }
          }, {
            properties: {
              type: {
                type: 'string',
                enum: ['percent']
              },
              value: {
                type: 'number'
              },
              on: ['source', 'target']
            }
          }]
        }
      }
    }
  }
};
