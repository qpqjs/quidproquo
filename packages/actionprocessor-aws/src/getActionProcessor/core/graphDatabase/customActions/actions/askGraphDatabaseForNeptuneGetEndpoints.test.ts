import { captureRequester } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askGraphDatabaseForNeptuneGetEndpoints } from './askGraphDatabaseForNeptuneGetEndpoints';
import { GraphDatabaseForNeptuneActionType } from './GraphDatabaseForNeptuneActionType';

describe('askGraphDatabaseForNeptuneGetEndpoints', () => {
  it('yields a GetEndpoints action carrying the database name', () => {
    const { action } = captureRequester(askGraphDatabaseForNeptuneGetEndpoints('myGraph'));

    expect(action).toEqual({
      type: GraphDatabaseForNeptuneActionType.GetEndpoints,
      payload: { graphDatabaseName: 'myGraph' },
    });
  });

  it('returns the endpoints the runtime resolves', () => {
    const endpoints = { readEndpoint: 'http://read', writeEndpoint: 'http://write' };

    const { returned } = captureRequester(askGraphDatabaseForNeptuneGetEndpoints('myGraph'), endpoints);

    expect(returned).toBe(endpoints);
  });
});
