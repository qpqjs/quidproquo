import { askEmailSendEmail, captureRequester, createActionProcessor, ProcessorFor } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askEmailSendEmail } from './askEmailSendEmail';
import { EmailActionType } from './EmailActionType';

describe('askEmailSendEmail', () => {
  it('yields a SendEmail action with the payload verbatim, including attachments', () => {
    const payload = {
      from: 'noreply@example.com',
      to: ['someone@example.com'],
      cc: ['cc@example.com'],
      bcc: ['bcc@example.com'],
      replyTo: ['support@example.com'],
      subject: 'Hello',
      bodyText: 'plain text',
      bodyHtml: '<p>plain text</p>',
      attachments: [{ base64Data: 'aGVsbG8=', filename: 'hello.txt', mimetype: 'text/plain' }],
    };

    const { action } = captureRequester(askEmailSendEmail(payload));

    expect(action).toEqual({
      type: EmailActionType.SendEmail,
      payload,
    });
  });
});

describe('askEmailSendEmail.errorType', () => {
  it('namespaces each error name under the SendEmail action type', () => {
    expect(askEmailSendEmail.errorType.MessageRejected).toBe(`${EmailActionType.SendEmail}-MessageRejected`);
    expect(askEmailSendEmail.errorType.SenderNotVerified).toBe(`${EmailActionType.SendEmail}-SenderNotVerified`);
    expect(askEmailSendEmail.errorType.AccountSuspended).toBe(`${EmailActionType.SendEmail}-AccountSuspended`);
    expect(askEmailSendEmail.errorType.SendingPaused).toBe(`${EmailActionType.SendEmail}-SendingPaused`);
    expect(askEmailSendEmail.errorType.Throttled).toBe(`${EmailActionType.SendEmail}-Throttled`);
    expect(askEmailSendEmail.errorType.LimitExceeded).toBe(`${EmailActionType.SendEmail}-LimitExceeded`);
    expect(askEmailSendEmail.errorType.BadRequest).toBe(`${EmailActionType.SendEmail}-BadRequest`);
  });
});
