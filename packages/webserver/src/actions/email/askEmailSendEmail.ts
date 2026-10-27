import { createActionRequester, QPQBinaryData } from 'quidproquo-core';

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
  errorTypes: ['MessageRejected', 'SenderNotVerified', 'AccountSuspended', 'SendingPaused', 'Throttled', 'LimitExceeded', 'BadRequest'],
  getPayload: (payload: EmailSendEmailActionPayload) => payload,
});
