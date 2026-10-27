import { actionResult, createActionProcessor, ProcessorFor } from 'quidproquo-core';
import { askEmailSendEmail, EmailActionType } from 'quidproquo-webserver';

import { randomUUID } from 'crypto';

// Local dev sends nothing: log what would have gone out and hand back a fake message id
const getProcessSendEmail = (): ProcessorFor<typeof askEmailSendEmail> => {
  return async (payload) => {
    console.log('[email] send skipped (dev server)', {
      from: payload.from,
      to: payload.to,
      cc: payload.cc,
      bcc: payload.bcc,
      replyTo: payload.replyTo,
      subject: payload.subject,
      bodyText: payload.bodyText?.slice(0, 200),
      bodyHtml: payload.bodyHtml?.slice(0, 200),
      attachments: payload.attachments?.map((attachment) => attachment.filename),
    });

    // Unique per send, like a real SES messageId: a subject-derived id would make
    // same-subject emails share a linkKey and fold into one entity in the admin
    return actionResult(`dev-server-email-${randomUUID()}`);
  };
};

export const getEmailSendEmailActionProcessor = createActionProcessor(askEmailSendEmail, () => getProcessSendEmail());
