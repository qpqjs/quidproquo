import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';
import { askEmailSendEmail, EmailActionType } from '@qpqjs/webserver';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sendEmail } from '../../../logic/sesV2/sendEmail';
import { getEmailSendEmailActionProcessor } from './getEmailSendEmailActionProcessor';

vi.mock('../../../logic/sesV2/sendEmail', () => ({ sendEmail: vi.fn() }));

const sesError = (name: string) => Object.assign(new Error(name), { name });
const payload = { from: 'noreply@app.example', to: ['joe@example.com'], subject: 'hi', bodyText: 'body' };

const resolveProcessor = async () => {
  const processors = await getEmailSendEmailActionProcessor(buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1')]), {} as any);
  return processors[EmailActionType.SendEmail];
};

describe('getEmailSendEmailActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(sendEmail).mockReset();
  });

  it('sends through SES in the deploy region and answers the message id', async () => {
    vi.mocked(sendEmail).mockResolvedValue('message-1');
    const processor = await resolveProcessor();

    const [messageId, error] = await invokeProcessor(processor, payload);

    expect(error).toBeUndefined();
    expect(messageId).toBe('message-1');
    expect(sendEmail).toHaveBeenCalledWith(payload, 'eu-west-1');
  });

  it.each([
    ['MessageRejected', askEmailSendEmail.errorType.MessageRejected],
    ['MailFromDomainNotVerifiedException', askEmailSendEmail.errorType.SenderNotVerified],
    ['AccountSuspendedException', askEmailSendEmail.errorType.AccountSuspended],
    ['SendingPausedException', askEmailSendEmail.errorType.SendingPaused],
    ['TooManyRequestsException', askEmailSendEmail.errorType.Throttled],
    ['LimitExceededException', askEmailSendEmail.errorType.LimitExceeded],
    ['BadRequestException', askEmailSendEmail.errorType.BadRequest],
  ])('maps %s to the matching error type', async (errorName: string, expectedType: string) => {
    vi.mocked(sendEmail).mockRejectedValue(sesError(errorName));
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor, payload);

    expect(error?.errorType).toBe(expectedType);
  });
});
