import { defineUserDirectory, ErrorTypeEnum, EventActionType, QpqFunctionRuntime } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

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

describe('cognito/customMessage getEventTransformResponseResultActionProcessor', () => {
  it('writes the rendered email onto the trigger event response', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);
    const event = buildTriggerEvent('CustomMessage_VerifyUserAttribute');
    const record = { success: true, result: { body: 'Hello', subject: 'Welcome' } };

    const [response] = await processor({ eventParams: [event], qpqEventRecordResponses: [record] });

    expect((response as any).response).toEqual({ emailMessage: 'Hello', emailSubject: 'Welcome' });
  });

  it('returns the event untouched when the record errored', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);
    const event = buildTriggerEvent('CustomMessage_VerifyUserAttribute');
    const record = { success: false, error: { errorType: ErrorTypeEnum.GenericError, errorText: 'boom' } };

    const [response] = await processor({ eventParams: [event], qpqEventRecordResponses: [record] });

    expect(response).toBe(event);
  });
});
