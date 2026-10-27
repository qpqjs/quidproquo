import { ActionHistory, NetworkActionType, StoryResult } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { networkRequestActionSearchDefinition } from './networkRequestActionSearchDefinition';

const storyResult = { correlation: 'corr-1', history: [] } as unknown as StoryResult<any>;

const networkEntry = (res: unknown): ActionHistory => ({
  act: {
    type: NetworkActionType.Request,
    payload: { url: '/users', method: 'GET', basePath: 'https://api.example.com', responseType: 'json' },
  },
  res,
  startedAt: '2026-07-24T00:00:01.000Z',
  finishedAt: '2026-07-24T00:00:01.250Z',
});

describe('networkRequestActionSearchDefinition', () => {
  it('extracts url, method, status and duration from a successful request', () => {
    const entry = networkEntry([{ data: {}, status: 500, statusText: 'Internal Server Error', headers: {} }]);

    const extracted = networkRequestActionSearchDefinition.action.extract(entry, storyResult, 0);

    expect(extracted).toEqual({
      fields: {
        url: 'https://api.example.com/users',
        method: 'GET',
        status: 500,
        durationMs: 250,
      },
    });
  });

  it('omits the status field when the request action errored', () => {
    const entry = networkEntry([undefined, { errorType: 'Generic', errorText: 'socket hang up' }]);

    const extracted = networkRequestActionSearchDefinition.action.extract(entry, storyResult, 0);

    expect(extracted?.fields.status).toBeUndefined();
    expect(extracted?.fields.url).toBe('https://api.example.com/users');
    expect(extracted?.fields.durationMs).toBe(250);
  });

  it('returns null for an entry without a payload', () => {
    const entry: ActionHistory = {
      act: { type: NetworkActionType.Request },
      res: [undefined],
      startedAt: '2026-07-24T00:00:01.000Z',
      finishedAt: '2026-07-24T00:00:01.001Z',
    };

    expect(networkRequestActionSearchDefinition.action.extract(entry, storyResult, 0)).toBeNull();
  });
});
