import { EmailSendEmailActionPayload } from 'quidproquo-webserver';

import { EmailContent, SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';

import { createAwsClient } from '../createAwsClient';
import { buildRawMimeMessage } from './buildRawMimeMessage';

// SES Simple content can't carry attachments, so those emails go through the raw MIME path.
// Either way the recipients come from Destination below, which is what keeps bcc addresses
// out of the message the recipients see.
const getEmailContent = (payload: EmailSendEmailActionPayload): EmailContent => {
  if (payload.attachments?.length) {
    return {
      Raw: { Data: new TextEncoder().encode(buildRawMimeMessage(payload)) },
    };
  }

  return {
    Simple: {
      Subject: { Data: payload.subject, Charset: 'UTF-8' },
      Body: {
        ...(payload.bodyText ? { Text: { Data: payload.bodyText, Charset: 'UTF-8' } } : {}),
        ...(payload.bodyHtml ? { Html: { Data: payload.bodyHtml, Charset: 'UTF-8' } } : {}),
      },
    },
  };
};

export const sendEmail = async (payload: EmailSendEmailActionPayload, region: string): Promise<string> => {
  const sesClient = createAwsClient(SESv2Client, { region });

  const response = await sesClient.send(
    new SendEmailCommand({
      FromEmailAddress: payload.from,
      Destination: {
        ToAddresses: payload.to,
        CcAddresses: payload.cc,
        BccAddresses: payload.bcc,
      },
      ReplyToAddresses: payload.replyTo,
      Content: getEmailContent(payload),
    }),
  );

  return response.MessageId || '';
};
