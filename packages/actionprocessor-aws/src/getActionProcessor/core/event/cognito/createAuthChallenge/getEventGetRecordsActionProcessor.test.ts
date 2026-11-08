import { defineUserDirectory, EventActionType, QpqFunctionRuntime } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';

const userDirectoryConfig = (runtime: QpqFunctionRuntime) =>
  buildTestQpqConfig([
    defineUserDirectory('ud', { customAuthRuntime: { createAuthChallenge: runtime, defineAuthChallenge: runtime, verifyAuthChallenge: runtime } }),
  ]);

describe('cognito/createAuthChallenge getEventGetRecordsActionProcessor', () => {
  it('maps the trigger event session and user attributes', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords);
    const event = {
      userName: 'joe',
      request: {
        session: [{ challengeResult: true, challengeMetadata: 'emailCode' }],
        userAttributes: { email: 'a@b.com', sub: '123' },
      },
    };

    const [records] = await processor({ eventParams: [event, {}] });

    expect(records).toEqual([
      {
        userName: 'joe',
        session: [{ challengeName: 'emailCode', challengeResult: true }],
        userAttributes: { email: 'a@b.com', userId: '123' },
        userNotFound: undefined,
      },
    ]);
  });

  it('passes the userNotFound flag through so a story can treat an unknown account like a real one', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords);
    const event = { userName: 'nobody', request: { session: [], userAttributes: {}, userNotFound: true } };

    const [records] = await processor({ eventParams: [event, {}] });

    expect((records as any[])[0].userNotFound).toBe(true);
  });
});
