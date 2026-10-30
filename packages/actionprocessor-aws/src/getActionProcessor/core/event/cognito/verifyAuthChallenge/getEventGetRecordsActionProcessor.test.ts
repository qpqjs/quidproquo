import { defineUserDirectory, EventActionType, QpqFunctionRuntime } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';

const userDirectoryConfig = (runtime: QpqFunctionRuntime) =>
  buildTestQpqConfig([
    defineUserDirectory('ud', { customAuthRuntime: { createAuthChallenge: runtime, defineAuthChallenge: runtime, verifyAuthChallenge: runtime } }),
  ]);

describe('cognito/verifyAuthChallenge getEventGetRecordsActionProcessor', () => {
  it('parses a json challenge answer', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords);
    const event = {
      request: {
        challengeAnswer: JSON.stringify({ code: '1234' }),
        userAttributes: { email: 'a@b.com' },
        userNotFound: false,
        privateChallengeParameters: { answer: '1234' },
      },
    };

    const [records] = await processor({ eventParams: [event, {}] });

    expect(records).toEqual([
      {
        challengeAnswer: { code: '1234' },
        userAttributes: { email: 'a@b.com' },
        userNotFound: false,
        privateChallengeParameters: { answer: '1234' },
      },
    ]);
  });

  it('defaults the challenge answer to an empty object when absent', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords);
    const event = { request: { challengeAnswer: '', userAttributes: {}, userNotFound: true, privateChallengeParameters: {} } };

    const [records] = await processor({ eventParams: [event, {}] });

    expect((records as any[])[0].challengeAnswer).toEqual({});
  });
});
