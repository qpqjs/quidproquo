import { ActionOf, askNetworkRequestBase, ErrorTypeEnum, GraphDatabaseInstanceType, NetworkActionType, runStory, StoryError } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { GraphDatabaseForNeptuneActionType } from '../customActions';
import { askRunNeptuneOpenCypherQuery } from './askRunNeptuneOpenCypherQuery';

const payload = {
  graphDatabaseName: 'graph',
  openCypherQuery: 'RETURN qpqElementId(n)',
  params: { a: 1 },
  instance: GraphDatabaseInstanceType.Read,
};

describe('askRunNeptuneOpenCypherQuery', () => {
  it('queries the read endpoint and converts the response', () => {
    let requestedUrl = '';
    let requestedBody: unknown;

    const result = runStory(askRunNeptuneOpenCypherQuery(payload), {
      [GraphDatabaseForNeptuneActionType.GetEndpoints]: { readEndpoint: 'http://read', writeEndpoint: 'http://write' },
      [NetworkActionType.Request]: (action: ActionOf<typeof askNetworkRequestBase>) => {
        requestedUrl = action.payload.url;
        requestedBody = action.payload.body;
        return { status: 200, data: { results: [{ count: 5 }] } };
      },
    });

    expect(requestedUrl).toBe('http://read/openCypher');
    expect(requestedBody).toEqual({ query: 'RETURN n.`~id`', parameters: { a: 1 } });
    expect(result).toEqual({ results: [{ count: 5 }] });
  });

  it('throws when the requested instance has no endpoint', () => {
    expect(() =>
      runStory(askRunNeptuneOpenCypherQuery({ ...payload, instance: GraphDatabaseInstanceType.Write }), {
        [GraphDatabaseForNeptuneActionType.GetEndpoints]: { readEndpoint: 'http://read' },
      }),
    ).toThrow('No [write] endpoint found');
  });

  it('throws when the query responds with a non-2xx status', () => {
    try {
      runStory(askRunNeptuneOpenCypherQuery(payload), {
        [GraphDatabaseForNeptuneActionType.GetEndpoints]: { readEndpoint: 'http://read' },
        [NetworkActionType.Request]: { status: 500, data: { results: [] } },
      });
      throw new Error('expected the story to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(StoryError);
      expect((error as StoryError).errorType).toBe(ErrorTypeEnum.GenericError);
      expect((error as StoryError).errorText).toBe('Unable to query database');
    }
  });
});
