import {
  ActionOf,
  askNetworkRequestBase,
  ConfigActionType,
  ErrorTypeEnum,
  GraphDatabaseInstanceType,
  NetworkActionType,
  runStory,
  StoryError,
} from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askRunNeo4jOpenCypherQuery } from './askRunNeo4jOpenCypherQuery';

const payload = {
  graphDatabaseName: 'myDb',
  openCypherQuery: 'MATCH (n) RETURN qpqElementId(n)',
  instance: GraphDatabaseInstanceType.Read,
  params: { limit: 10 },
};

const okResponse = {
  status: 200,
  data: { data: { fields: ['result'], values: [[1]] } },
};

describe('askRunNeo4jOpenCypherQuery', () => {
  it('builds the neo4j request and returns the converted cypher response', () => {
    let requested: ActionOf<typeof askNetworkRequestBase>['payload'] | undefined;

    const result = runStory(askRunNeo4jOpenCypherQuery(payload), {
      [ConfigActionType.GetParameter]: 'my-instance',
      [ConfigActionType.GetSecret]: 'sekret',
      [NetworkActionType.Request]: (action: ActionOf<typeof askNetworkRequestBase>) => {
        requested = action.payload;
        return okResponse;
      },
    });

    expect(result).toEqual({ results: [{ result: 1 }] });
    expect(requested?.method).toBe('POST');
    expect(requested?.url).toBe('HTTPS://my-instance.databases.neo4j.io:443/db/neo4j/query/v2');
    expect(requested?.body).toEqual({
      statement: 'MATCH (n) RETURN elementId(n)',
      parameters: { limit: 10 },
    });
    expect(requested?.headers?.Authorization).toBe(`Basic ${Buffer.from('neo4j:sekret').toString('base64')}`);
  });

  it('throws a GenericError when the database responds with a non-2xx status', () => {
    const run = () =>
      runStory(askRunNeo4jOpenCypherQuery(payload), {
        [ConfigActionType.GetParameter]: 'my-instance',
        [ConfigActionType.GetSecret]: 'sekret',
        [NetworkActionType.Request]: { status: 500, data: {} },
      });

    expect(run).toThrow(StoryError);
    expect(run).toThrow(ErrorTypeEnum.GenericError);
  });
});
