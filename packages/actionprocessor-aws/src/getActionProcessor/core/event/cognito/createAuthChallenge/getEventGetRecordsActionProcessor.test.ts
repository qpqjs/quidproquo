import { defineUserDirectory, EventActionType, QpqFunctionRuntime } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';

const userDirectoryConfig = (runtime: QpqFunctionRuntime) =>
  buildTestQpqConfig([defineUserDirectory('ud', { customAuthRuntime: { createAuthChallenge: runtime } })]);

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
      },
    ]);
  });
});
