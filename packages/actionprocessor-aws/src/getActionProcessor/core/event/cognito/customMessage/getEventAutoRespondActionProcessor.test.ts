import { defineUserDirectory, ErrorTypeEnum, EventActionType, QpqFunctionRuntime } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';
import { EmailSendEventType } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { getEventAutoRespondActionProcessor } from './getEventAutoRespondActionProcessor';

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

describe('cognito/customMessage getEventAutoRespondActionProcessor', () => {
  it('responds with null when the email template exists', async () => {
    const processor = await resolveEventProcessor(getEventAutoRespondActionProcessor('ud'), EventActionType.AutoRespond, configWithTemplates);

    expect(await processor({ qpqEventRecord: { eventType: EmailSendEventType.ResetPassword }, matchResult: {} })).toEqual([null]);
  });

  it('returns a NotFound error when the email template is missing', async () => {
    const processor = await resolveEventProcessor(getEventAutoRespondActionProcessor('ud'), EventActionType.AutoRespond);

    const [, error] = await processor({ qpqEventRecord: { eventType: EmailSendEventType.ResetPassword }, matchResult: {} });

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });

  it('returns a NotFound error for an unknown event type', async () => {
    const processor = await resolveEventProcessor(getEventAutoRespondActionProcessor('ud'), EventActionType.AutoRespond, configWithTemplates);

    const [, error] = await processor({ qpqEventRecord: { eventType: 'OTHER' }, matchResult: {} });

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });
});
