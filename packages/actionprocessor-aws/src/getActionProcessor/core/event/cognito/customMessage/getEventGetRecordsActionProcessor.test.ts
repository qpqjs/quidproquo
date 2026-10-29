import { defineUserDirectory, EventActionType, QpqFunctionRuntime } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';
import { EmailSendEventType } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';

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

describe('cognito/customMessage getEventGetRecordsActionProcessor', () => {
  it.each([
    ['CustomMessage_ForgotPassword', { userInitiated: 'true' }, EmailSendEventType.ResetPassword],
    ['CustomMessage_ForgotPassword', undefined, EmailSendEventType.ResetPasswordAdmin],
    ['CustomMessage_VerifyUserAttribute', undefined, EmailSendEventType.VerifyEmail],
    ['CustomMessage_SignUp', undefined, EmailSendEventType.VerifyEmail],
  ])(
    'maps triggerSource %s to the right email event type',
    async (triggerSource: string, clientMetadata: Record<string, string> | undefined, expected: EmailSendEventType) => {
      const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords);

      const [records] = await processor({ eventParams: [buildTriggerEvent(triggerSource, clientMetadata), {}] });

      expect((records as any[])[0]).toEqual({
        eventType: expected,
        code: 'CODE',
        link: 'LINK',
        attributes: { email: 'a@b.com' },
        username: 'USER',
      });
    },
  );
});
