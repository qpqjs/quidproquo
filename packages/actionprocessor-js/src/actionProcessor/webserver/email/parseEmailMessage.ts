import { EmailMessage, EmailMessageAddress, EmailMessageAttachment, EmailMessageAuthentication } from 'quidproquo-webserver';

import PostalMime, { Address, Attachment } from 'postal-mime';

const toAddress = (mailbox: { name: string; address: string }): EmailMessageAddress => ({
  address: mailbox.address,
  ...(mailbox.name ? { name: mailbox.name } : {}),
});

// A group address (`team: a@x, b@x;`) contributes its members; a bare mailbox contributes itself.
const flattenAddresses = (addresses: Address[] | Address | undefined): EmailMessageAddress[] => {
  const list = addresses === undefined ? [] : Array.isArray(addresses) ? addresses : [addresses];

  return list.flatMap((address) => (address.address === undefined ? address.group.map(toAddress) : [toAddress(address)]));
};

// Parsed with attachmentEncoding 'base64', so content is a string; the byte forms are
// handled anyway so a parser change cannot silently produce garbage.
const attachmentBase64 = (content: Attachment['content']): string => {
  if (typeof content === 'string') {
    return content;
  }
  if (content instanceof ArrayBuffer) {
    return Buffer.from(content).toString('base64');
  }
  return Buffer.from(content.buffer, content.byteOffset, content.byteLength).toString('base64');
};

const toAttachment = (attachment: Attachment): EmailMessageAttachment => ({
  ...(attachment.filename ? { filename: attachment.filename } : {}),
  mimeType: attachment.mimeType,
  base64Data: attachmentBase64(attachment.content),
});

// `Authentication-Results: mx.example; spf=pass ...; dkim=pass ...; dmarc=fail ...`: the
// token after each method name is its result.
const parseAuthenticationResults = (header: string | undefined): EmailMessageAuthentication => {
  const results: EmailMessageAuthentication = {};
  if (!header) {
    return results;
  }

  for (const method of ['spf', 'dkim', 'dmarc'] as const) {
    const match = header.match(new RegExp(`(?:^|;)\\s*${method}=([a-z]+)`, 'i'));
    if (match) {
      results[method] = match[1].toLowerCase();
    }
  }

  return results;
};

// The addresses the provider delivered to, from the headers it stamps, falling back to the
// header recipients when there are none (a message not delivered by a provider).
const resolveRecipients = (headers: { key: string; value: string }[], to: EmailMessageAddress[], cc: EmailMessageAddress[]): string[] => {
  const delivered = headers
    .filter((header) => header.key === 'delivered-to' || header.key === 'x-original-to')
    .map((header) => header.value.trim().toLowerCase());

  return delivered.length > 0 ? [...new Set(delivered)] : [...to, ...cc].map((address) => address.address.toLowerCase());
};

/** The raw MIME bytes of one message as an EmailMessage. */
export const parseEmailMessage = async (raw: Buffer): Promise<EmailMessage> => {
  const email = await PostalMime.parse(raw, { attachmentEncoding: 'base64' });

  const to = flattenAddresses(email.to);
  const cc = flattenAddresses(email.cc);

  return {
    recipients: resolveRecipients(email.headers, to, cc),

    from: flattenAddresses(email.from),
    to,
    cc,
    replyTo: flattenAddresses(email.replyTo),

    subject: email.subject ?? '',
    ...(email.text !== undefined ? { text: email.text } : {}),
    ...(email.html !== undefined ? { html: email.html } : {}),

    ...(email.messageId ? { messageId: email.messageId } : {}),
    ...(email.date ? { date: email.date } : {}),
    attachments: email.attachments.map(toAttachment),

    authentication: parseAuthenticationResults(email.headers.find((header) => header.key === 'authentication-results')?.value),
  };
};
