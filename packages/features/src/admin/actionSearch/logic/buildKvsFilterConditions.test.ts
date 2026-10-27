import { kvsAnd, kvsBetween, kvsContains, kvsEqual, kvsGreaterThanOrEqual, kvsLessThanOrEqual } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { ActionSearchFieldDefinition } from '../domain/ActionSearchFieldDefinition';
import { ActionSearchFieldType } from '../domain/ActionSearchFieldType';
import { ActionSearchFilterOperator } from '../domain/ActionSearchFilterOperator';
import { buildKvsFilterConditions } from './buildKvsFilterConditions';

const fields: ActionSearchFieldDefinition[] = [
  { name: 'url', label: 'Url', type: ActionSearchFieldType.String, operator: ActionSearchFilterOperator.Contains },
  { name: 'method', label: 'Method', type: ActionSearchFieldType.Enum, operator: ActionSearchFilterOperator.Equals, enumValues: ['GET', 'POST'] },
  { name: 'status', label: 'Status', type: ActionSearchFieldType.Number, operator: ActionSearchFilterOperator.Range },
];

describe('buildKvsFilterConditions', () => {
  it('returns null when there are no usable filters', () => {
    expect(buildKvsFilterConditions([], fields)).toBeNull();
    expect(buildKvsFilterConditions([{ fieldName: 'url', operator: ActionSearchFilterOperator.Contains, value: '' }], fields)).toBeNull();
  });

  it('drops filters for field names not in the schema', () => {
    const condition = buildKvsFilterConditions([{ fieldName: 'correlation', operator: ActionSearchFilterOperator.Equals, value: 'corr-1' }], fields);

    expect(condition).toBeNull();
  });

  it('maps equals and contains to their kvs conditions', () => {
    expect(buildKvsFilterConditions([{ fieldName: 'method', operator: ActionSearchFilterOperator.Equals, value: 'GET' }], fields)).toEqual(
      kvsEqual('method', 'GET'),
    );

    expect(buildKvsFilterConditions([{ fieldName: 'url', operator: ActionSearchFilterOperator.Contains, value: '/users' }], fields)).toEqual(
      kvsContains('url', '/users'),
    );
  });

  it('maps ranges to between or half-open comparisons with number coercion', () => {
    expect(
      buildKvsFilterConditions([{ fieldName: 'status', operator: ActionSearchFilterOperator.Range, rangeStart: '500', rangeEnd: '599' }], fields),
    ).toEqual(kvsBetween('status', 500, 599));

    expect(buildKvsFilterConditions([{ fieldName: 'status', operator: ActionSearchFilterOperator.Range, rangeStart: '500' }], fields)).toEqual(
      kvsGreaterThanOrEqual('status', 500),
    );

    expect(buildKvsFilterConditions([{ fieldName: 'status', operator: ActionSearchFilterOperator.Range, rangeEnd: '399' }], fields)).toEqual(
      kvsLessThanOrEqual('status', 399),
    );
  });

  it('combines multiple filters with and', () => {
    const condition = buildKvsFilterConditions(
      [
        { fieldName: 'method', operator: ActionSearchFilterOperator.Equals, value: 'POST' },
        { fieldName: 'status', operator: ActionSearchFilterOperator.Range, rangeStart: '500' },
      ],
      fields,
    );

    expect(condition).toEqual(kvsAnd([kvsEqual('method', 'POST'), kvsGreaterThanOrEqual('status', 500)]));
  });
});
