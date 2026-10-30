import { Action, GraphDatabaseInstanceType, NetworkActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { GraphDatabaseForNeptuneActionType } from '../customActions';
import { askRunNeptuneOpenCypherQuery } from './askRunNeptuneOpenCypherQuery';

// Security regression: the openCypher POST goes out with the signed headers over exactly the body that was signed.
describe('askRunNeptuneOpenCypherQuery', () => {
  it('signs the exact body it sends and attaches the signed headers', () => {
    let signed: { url: string; body: string } | undefined;
    let request: Action<any> | undefined;

    runStory(
      askRunNeptuneOpenCypherQuery({
        graphDatabaseName: 'graph',
        openCypherQuery: 'MATCH (n) RETURN n',
        params: { a: 1 },
        instance: GraphDatabaseInstanceType.Write,
      }),
      {
        [GraphDatabaseForNeptuneActionType.GetEndpoints]: { readEndpoint: 'https://read:8182', writeEndpoint: 'https://write:8182' },
        [GraphDatabaseForNeptuneActionType.SignRequest]: (action: Action<{ url: string; body: string }>) => {
          signed = action.payload;
          return { authorization: 'AWS4-HMAC-SHA256 signed', 'x-amz-date': '20260101T000000Z', host: 'write:8182' };
        },
        [NetworkActionType.Request]: (action: Action<any>) => {
          request = action;
          return { status: 200, statusText: 'OK', headers: {}, setCookies: [], data: { results: [] } };
        },
      },
    );

    expect(signed?.url).toBe('https://write:8182/openCypher');
    expect(request?.payload.url).toBe('https://write:8182/openCypher');
    expect(request?.payload.body).toBe(signed?.body);
    expect(JSON.parse(signed!.body)).toEqual({ query: 'MATCH (n) RETURN n', parameters: { a: 1 } });
    expect(request?.payload.headers).toMatchObject({ authorization: 'AWS4-HMAC-SHA256 signed', 'x-amz-date': '20260101T000000Z' });
  });
});
