import { buildRawMimeMessage } from '@qpqjs/actionprocessor-aws';
import { actionResult, actionResultError, createActionProcessor, generateUuid, ProcessorFor, QPQConfig, qpqCoreUtils } from '@qpqjs/core';
import { askEmailSendEmail } from '@qpqjs/webserver';

import { deliverLocalEmail } from '../../../logic/email/deliverLocalEmail';
import { resolveLocalEmailInboxes } from '../../../logic/email/resolveLocalEmailInboxes';
import { writeLocalEmailOutbox } from '../../../logic/email/writeLocalEmailOutbox';
import { ResolvedDevServerConfig } from '../../../types';

// Local send: the same raw message the provider would be handed is kept in the runtime outbox,
// and delivered to every local receiver whose host a recipient is at, so a service that mails
// its own receiving domain gets the message back through its onEmail here as it does deployed.
// Bcc recipients are delivered but, as deployed, never written into the message headers.
const getProcessSendEmail = (qpqConfig: QPQConfig, devServerConfig: ResolvedDevServerConfig): ProcessorFor<typeof askEmailSendEmail> => {
  const serviceName = qpqCoreUtils.getApplicationModuleName(qpqConfig);

  return async (payload) => {
    const recipients = [...payload.to, ...(payload.cc ?? []), ...(payload.bcc ?? [])];
    if (recipients.length === 0) {
      return actionResultError(askEmailSendEmail.errorType.BadRequest, 'An email needs at least one recipient');
    }

    // Unique per send, like a real SES messageId: a subject-derived id would make
    // same-subject emails share a linkKey and fold into one entity in the admin
    const messageId = `dev-server-email-${generateUuid()}`;
    const rawMessage = buildRawMimeMessage(payload, messageId);

    const outboxPath = await writeLocalEmailOutbox(devServerConfig.runtimePath, serviceName, messageId, rawMessage);
    const inboxes = await resolveLocalEmailInboxes(devServerConfig);
    const delivered = await deliverLocalEmail(devServerConfig.fileStorageConfig.storagePath, inboxes, recipients, messageId, rawMessage);

    console.log('[email] sent locally (dev server)', {
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
      outbox: outboxPath,
      delivered,
    });

    return actionResult(messageId);
  };
};

export const getEmailSendEmailActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askEmailSendEmail, (qpqConfig) => getProcessSendEmail(qpqConfig, devServerConfig));
