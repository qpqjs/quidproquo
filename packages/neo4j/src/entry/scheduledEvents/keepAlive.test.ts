import { GraphDatabaseActionType, GraphDatabaseExecuteOpenCypherQueryAction, GraphDatabaseInstanceType, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { keepAlive } from './keepAlive';

describe('keepAlive', () => {
  it('runs a trivial read query against the scheduled database', () => {
    let queried: GraphDatabaseExecuteOpenCypherQueryAction['payload'] | undefined;

    runStory(keepAlive({ time: '2024-01-01T00:00:00.000Z', correlation: 'test', metadata: { databaseName: 'myDb' } }), {
      [GraphDatabaseActionType.ExecuteOpenCypherQuery]: (action: GraphDatabaseExecuteOpenCypherQueryAction) => {
        queried = action.payload;
        return { results: [] };
      },
    });

    expect(queried?.graphDatabaseName).toBe('myDb');
    expect(queried?.instance).toBe(GraphDatabaseInstanceType.Read);
    expect(queried?.openCypherQuery).toBe('RETURN 1 AS result');
  });
});
