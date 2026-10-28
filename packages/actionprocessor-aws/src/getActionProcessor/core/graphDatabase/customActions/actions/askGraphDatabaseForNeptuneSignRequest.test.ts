import { captureRequester } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { askGraphDatabaseForNeptuneSignRequest } from './askGraphDatabaseForNeptuneSignRequest';
import { GraphDatabaseForNeptuneActionType } from './GraphDatabaseForNeptuneActionType';

describe('askGraphDatabaseForNeptuneSignRequest', () => {
  it('yields a SignRequest action carrying the url and the exact body to sign', () => {
    const { action } = captureRequester(askGraphDatabaseForNeptuneSignRequest('https://db.example.com:8182/openCypher', '{"query":"RETURN 1"}'));

    expect(action).toEqual({
      type: GraphDatabaseForNeptuneActionType.SignRequest,
      payload: { url: 'https://db.example.com:8182/openCypher', body: '{"query":"RETURN 1"}' },
    });
  });

  it('returns the signed headers the runtime resolves', () => {
    const headers = { authorization: 'AWS4-HMAC-SHA256 ...', 'x-amz-date': '20260101T000000Z' };

    const { returned } = captureRequester(askGraphDatabaseForNeptuneSignRequest('https://db/openCypher', '{}'), headers);

    expect(returned).toBe(headers);
  });
});
