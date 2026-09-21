/** One mailbox in a parsed message header. */
export type EmailMessageAddress = {
  address: string;
  name?: string;
};

/** A file the message carried, decoded. */
export type EmailMessageAttachment = {
  filename?: string;
  mimeType: string;
  base64Data: string;
};

/**
 * The provider's verdicts on the message, from its Authentication-Results header. Each is the
 * raw result token (`pass`, `fail`, `softfail`, `none`, ...) or absent when the provider gave
 * none. `from` is what the sender claims; these are the only evidence for who actually sent it.
 */
export type EmailMessageAuthentication = {
  spf?: string;
  dkim?: string;
  dmarc?: string;
};

/** A received message as askEmailParse returns it. */
export type EmailMessage = {
  // The addresses the provider delivered to (Delivered-To / X-Original-To), lower-cased.
  // A per-inbox lookup keys on these: the `to` header can name addresses this app never saw.
  recipients: string[];

  from: EmailMessageAddress[];
  to: EmailMessageAddress[];
  cc: EmailMessageAddress[];
  replyTo: EmailMessageAddress[];

  subject: string;
  text?: string;
  html?: string;

  messageId?: string;
  date?: string;
  attachments: EmailMessageAttachment[];

  authentication: EmailMessageAuthentication;
};
