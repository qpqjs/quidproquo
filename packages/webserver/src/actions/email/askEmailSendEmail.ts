import { createActionRequester, QPQBinaryData } from '@qpqjs/core';

import { EmailActionType } from './EmailActionType';

// At least one of bodyText / bodyHtml must be provided
export type EmailSendEmailBody = { bodyText: string; bodyHtml?: string } | { bodyText?: string; bodyHtml: string };

export type EmailSendEmailActionPayload = {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string[];
  subject: string;
  attachments?: QPQBinaryData[];
} & EmailSendEmailBody;

export const askEmailSendEmail = createActionRequester<string>()({
  actionType: EmailActionType.SendEmail,
  errorTypes: [
    'MessageRejected', // the mail service refused the message content
    'SenderNotVerified', // the from address is not verified for sending
    'AccountSuspended', // the sending account is suspended
    'SendingPaused', // sending is paused for the account
    'Throttled', // the mail service is rate limiting sends
    'LimitExceeded', // a sending quota is exhausted
    'BadRequest', // the request itself is malformed
  ],
  getPayload: (payload: EmailSendEmailActionPayload) => payload,
});
