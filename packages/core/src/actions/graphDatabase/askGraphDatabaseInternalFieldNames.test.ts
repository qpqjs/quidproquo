import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askGraphDatabaseInternalFieldNames } from './askGraphDatabaseInternalFieldNames';
import { GraphDatabaseActionType } from './GraphDatabaseActionType';

describe('askGraphDatabaseInternalFieldNames', () => {
  it('yields an InternalFieldNames action with no payload', () => {
    const { action } = captureRequester(askGraphDatabaseInternalFieldNames());

    expect(action).toEqual({
      type: GraphDatabaseActionType.InternalFieldNames,
    });
  });

  it('returns the field names the runtime resolves', () => {
    const fieldNames = ['id', 'createdAt'];
    const { returned } = captureRequester(askGraphDatabaseInternalFieldNames(), fieldNames);

    expect(returned).toBe(fieldNames);
  });
});
