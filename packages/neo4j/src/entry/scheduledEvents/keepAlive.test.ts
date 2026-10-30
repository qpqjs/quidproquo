import { ActionOf, askGraphDatabaseExecuteOpenCypherQuery, GraphDatabaseActionType, GraphDatabaseInstanceType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { keepAlive } from './keepAlive';

describe('keepAlive', () => {
  it('runs a trivial read query against the scheduled database', () => {
    let queried: ActionOf<typeof askGraphDatabaseExecuteOpenCypherQuery>['payload'] | undefined;

    runStory(keepAlive({ time: '2024-01-01T00:00:00.000Z', correlation: 'test', metadata: { databaseName: 'myDb' } }), {
      [GraphDatabaseActionType.ExecuteOpenCypherQuery]: (action: ActionOf<typeof askGraphDatabaseExecuteOpenCypherQuery>) => {
        queried = action.payload;
        return { results: [] };
      },
    });

    expect(queried?.graphDatabaseName).toBe('myDb');
    expect(queried?.instance).toBe(GraphDatabaseInstanceType.Read);
    expect(queried?.openCypherQuery).toBe('RETURN 1 AS result');
  });
});
