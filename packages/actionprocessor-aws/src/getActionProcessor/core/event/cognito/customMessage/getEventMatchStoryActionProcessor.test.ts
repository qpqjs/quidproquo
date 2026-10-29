import { defineUserDirectory, ErrorTypeEnum, EventActionType, QpqFunctionRuntime } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';
import { EmailSendEventType } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';

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

describe('cognito/customMessage getEventMatchStoryActionProcessor', () => {
  it('returns the configured template runtime for a known event type', async () => {
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor('ud'), EventActionType.MatchStory, configWithTemplates);

    const [match] = await processor({ qpqEventRecord: { eventType: EmailSendEventType.ResetPassword } });

    expect((match as any).runtime).toEqual(runtime);
  });

  it('returns a NotFound error for an unknown event type', async () => {
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor('ud'), EventActionType.MatchStory, configWithTemplates);

    const [, error] = await processor({ qpqEventRecord: { eventType: 'OTHER' } });

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });
});
