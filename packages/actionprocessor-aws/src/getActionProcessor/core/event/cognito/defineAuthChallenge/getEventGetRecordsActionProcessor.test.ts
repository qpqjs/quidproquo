import { defineUserDirectory, EventActionType, QpqFunctionRuntime } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';

const userDirectoryConfig = (runtime: QpqFunctionRuntime) =>
  buildTestQpqConfig([
    defineUserDirectory('ud', { customAuthRuntime: { createAuthChallenge: runtime, defineAuthChallenge: runtime, verifyAuthChallenge: runtime } }),
  ]);

describe('cognito/defineAuthChallenge getEventGetRecordsActionProcessor', () => {
  it('maps the trigger event session and user attributes', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords);
    const event = { userName: 'joe', request: { session: [], userAttributes: { email: 'a@b.com' } } };

    const [records] = await processor({ eventParams: [event, {}] });

    expect(records).toEqual([{ userName: 'joe', session: [], userAttributes: { email: 'a@b.com' }, userNotFound: undefined }]);
  });

  it('passes the userNotFound flag through so a story can treat an unknown account like a real one', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords);
    const event = { userName: 'nobody', request: { session: [], userAttributes: {}, userNotFound: true } };

    const [records] = await processor({ eventParams: [event, {}] });

    expect((records as any[])[0].userNotFound).toBe(true);
  });
});
