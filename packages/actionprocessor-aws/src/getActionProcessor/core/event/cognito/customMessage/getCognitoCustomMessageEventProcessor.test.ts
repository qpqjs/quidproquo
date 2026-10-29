import { getEventGetStorySessionNoopActionProcessor as getEventGetStorySessionActionProcessor } from '@qpqjs/actionprocessor-js';
import { defineUserDirectory, EventActionType, QpqFunctionRuntime } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

const runtime: QpqFunctionRuntime = '/entry/email::emailTemplate';
const configWithTemplates = buildTestQpqConfig([
  defineUserDirectory('ud', { emailTemplates: { resetPassword: runtime, resetPasswordAdmin: runtime, verifyEmail: runtime } }),
]);

const buildTriggerEvent = (triggerSource: string, clientMetadata?: Record<string, string>): any => ({
  triggerSource,
  request: {
    codeParameter: 'CODE',
    linkParameter: 'LINK',
    userAttributes: { email: 'a@b.com' },
    usernameParameter: 'USER',
    clientMetadata,
  },
  response: {},
});

describe('customMessage getCognitoCustomMessageEventProcessor', () => {
  it('returns no story session', async () => {
    const processor = await resolveEventProcessor(getEventGetStorySessionActionProcessor, EventActionType.GetStorySession);

    expect(await processor({ qpqEventRecord: {}, eventParams: [] })).toEqual([undefined]);
  });
});
