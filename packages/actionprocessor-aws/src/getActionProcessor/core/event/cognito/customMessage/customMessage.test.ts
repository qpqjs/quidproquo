import { buildTestQpqConfig, ErrorTypeEnum, EventActionType, QPQCoreConfigSettingType } from 'quidproquo-core';
import { EmailSendEventType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { resolveEventProcessor } from '../../../../../testing/eventProcessorTestHelpers';
import { getEventAutoRespondActionProcessor } from './getEventAutoRespondActionProcessor';
import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';
import { getEventGetStorySessionActionProcessor } from './getEventGetStorySessionActionProcessor';
import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';
import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

// GLOBAL_USER_DIRECTORY_NAME is read from process.env at import time (undefined in tests).
const runtime = { src: 'emailTemplate' };
const configWithTemplates = buildTestQpqConfig([
  {
    configSettingType: QPQCoreConfigSettingType.userDirectory,
    name: undefined,
    emailTemplates: { resetPassword: runtime, resetPasswordAdmin: runtime, verifyEmail: runtime },
  } as any,
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

describe('cognito/customMessage getEventMatchStoryActionProcessor', () => {
  it('returns the configured template runtime for a known event type', async () => {
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory, configWithTemplates);

    const [match] = await processor({ qpqEventRecord: { eventType: EmailSendEventType.ResetPassword } });

    expect((match as any).runtime).toEqual(runtime);
  });

  it('returns a NotFound error for an unknown event type', async () => {
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory, configWithTemplates);

    const [, error] = await processor({ qpqEventRecord: { eventType: 'OTHER' } });

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });
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

describe('cognito/customMessage getEventAutoRespondActionProcessor', () => {
  it('responds with null when the email template exists', async () => {
    const processor = await resolveEventProcessor(getEventAutoRespondActionProcessor, EventActionType.AutoRespond, configWithTemplates);

    expect(await processor({ qpqEventRecord: { eventType: EmailSendEventType.ResetPassword }, matchResult: {} })).toEqual([null]);
  });

  it('returns a NotFound error when the email template is missing', async () => {
    const processor = await resolveEventProcessor(getEventAutoRespondActionProcessor, EventActionType.AutoRespond);

    const [, error] = await processor({ qpqEventRecord: { eventType: EmailSendEventType.ResetPassword }, matchResult: {} });

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });

  it('returns a NotFound error for an unknown event type', async () => {
    const processor = await resolveEventProcessor(getEventAutoRespondActionProcessor, EventActionType.AutoRespond, configWithTemplates);

    const [, error] = await processor({ qpqEventRecord: { eventType: 'OTHER' }, matchResult: {} });

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });
});

describe('cognito/customMessage getEventGetStorySessionActionProcessor', () => {
  it('returns no story session', async () => {
    const processor = await resolveEventProcessor(getEventGetStorySessionActionProcessor, EventActionType.GetStorySession);

    expect(await processor({ qpqEventRecord: {}, eventParams: [] })).toEqual([undefined]);
  });
});
