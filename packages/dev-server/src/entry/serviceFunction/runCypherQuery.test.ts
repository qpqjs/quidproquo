import { GraphDatabaseActionType, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { runCypherQuery } from './runCypherQuery';

describe('runCypherQuery', () => {
  const event = {
    payload: {
      graphDatabaseName: 'graph',
      instance: 'writer',
      openCypherQuery: 'MATCH (n) RETURN n',
      params: { limit: 1 },
    },
  } as any;

  it('yields the graph cypher action with the event payload and returns its response', () => {
    let seenPayload: any;
    const response = { results: [{ n: 1 }] };

    const result = runStory(runCypherQuery(event), {
      [GraphDatabaseActionType.ExecuteOpenCypherQuery]: (action: any) => {
        seenPayload = action.payload;
        return response;
      },
    });

    expect(result).toBe(response);
    expect(seenPayload).toMatchObject({
      graphDatabaseName: 'graph',
      instance: 'writer',
      openCypherQuery: 'MATCH (n) RETURN n',
      params: { limit: 1 },
    });
  });
});
