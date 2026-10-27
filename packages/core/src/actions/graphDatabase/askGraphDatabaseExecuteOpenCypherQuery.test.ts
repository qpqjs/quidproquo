import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { askGraphDatabaseExecuteOpenCypherQuery } from './askGraphDatabaseExecuteOpenCypherQuery';
import { GraphDatabaseInstanceType } from './askGraphDatabaseExecuteOpenCypherQuery';
import { GraphDatabaseActionType } from './GraphDatabaseActionType';

describe('askGraphDatabaseExecuteOpenCypherQuery', () => {
  it('yields an ExecuteOpenCypherQuery action with the name, query, params and instance', () => {
    const { action } = captureRequester(
      askGraphDatabaseExecuteOpenCypherQuery('graph', GraphDatabaseInstanceType.Write, 'MATCH (n) RETURN n', { id: 1 }),
    );

    expect(action).toEqual({
      type: GraphDatabaseActionType.ExecuteOpenCypherQuery,
      payload: {
        graphDatabaseName: 'graph',
        openCypherQuery: 'MATCH (n) RETURN n',
        params: { id: 1 },
        instance: GraphDatabaseInstanceType.Write,
      },
    });
  });

  it('maps params to undefined when omitted', () => {
    const { action } = captureRequester(askGraphDatabaseExecuteOpenCypherQuery('graph', GraphDatabaseInstanceType.Read, 'MATCH (n) RETURN n'));

    expect(action).toEqual({
      type: GraphDatabaseActionType.ExecuteOpenCypherQuery,
      payload: {
        graphDatabaseName: 'graph',
        openCypherQuery: 'MATCH (n) RETURN n',
        params: undefined,
        instance: GraphDatabaseInstanceType.Read,
      },
    });
  });

  it('returns the query response the runtime resolves', () => {
    const response = { results: [] };
    const { returned } = captureRequester(
      askGraphDatabaseExecuteOpenCypherQuery('graph', GraphDatabaseInstanceType.Read, 'MATCH (n) RETURN n'),
      response,
    );

    expect(returned).toBe(response);
  });
});
