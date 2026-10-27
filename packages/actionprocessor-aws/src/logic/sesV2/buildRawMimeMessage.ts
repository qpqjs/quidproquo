import { QPQBinaryData } from 'quidproquo-core';
import { EmailSendEmailActionPayload } from 'quidproquo-webserver';

const CRLF = '\r\n';

// Header values must never contain CR/LF, or a caller-supplied string could inject extra headers
const sanitizeHeaderValue = (value: string): string => value.replace(/[\r\n]+/g, ' ').trim();

// RFC 2047 encoded-word for header text that isn't printable ascii (e.g. subjects with emoji)
const encodeHeaderText = (value: string): string => {
  const sanitized = sanitizeHeaderValue(value);

  if (/^[\x20-\x7e]*$/.test(sanitized)) {
    return sanitized;
  }

  return `=?UTF-8?B?${Buffer.from(sanitized, 'utf8').toString('base64')}?=`;
};

// RFC 2045 requires base64 body lines of at most 76 characters
const wrapBase64 = (base64Data: string): string => {
  const lines = base64Data.match(/.{1,76}/g) || [];

  return lines.join(CRLF);
};

const buildBodyPart = (contentType: string, content: string, boundary: string): string[] => [
  `--${boundary}`,
  `Content-Type: ${contentType}; charset=UTF-8`,
  'Content-Transfer-Encoding: base64',
  '',
  wrapBase64(Buffer.from(content, 'utf8').toString('base64')),
];

const buildAttachmentPart = (attachment: QPQBinaryData, boundary: string): string[] => {
  const filename = encodeHeaderText(attachment.filename);
  const contentDisposition = attachment.contentDisposition
    ? sanitizeHeaderValue(attachment.contentDisposition)
    : `attachment; filename="${filename}"`;

  return [
    `--${boundary}`,
    `Content-Type: ${sanitizeHeaderValue(attachment.mimetype || 'application/octet-stream')}; name="${filename}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: ${contentDisposition}`,
    '',
    wrapBase64(attachment.base64Data),
  ];
};

// Builds an RFC 5322 message: multipart/mixed wrapping a multipart/alternative body plus one
// part per attachment. Bcc recipients are deliberately never written into the headers; they
// travel only in the SES Destination so other recipients can't see them. boundarySeed exists
// so tests get deterministic output.
export const buildRawMimeMessage = (payload: EmailSendEmailActionPayload, boundarySeed: string = 'qpq'): string => {
  const mixedBoundary = `----=_${boundarySeed}_mixed`;
  const alternativeBoundary = `----=_${boundarySeed}_alternative`;

  const headers = [
    `From: ${encodeHeaderText(payload.from)}`,
    `To: ${payload.to.map(encodeHeaderText).join(', ')}`,
    ...(payload.cc?.length ? [`Cc: ${payload.cc.map(encodeHeaderText).join(', ')}`] : []),
    ...(payload.replyTo?.length ? [`Reply-To: ${payload.replyTo.map(encodeHeaderText).join(', ')}`] : []),
    `Subject: ${encodeHeaderText(payload.subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
  ];

  const bodyParts = [
    ...(payload.bodyText ? buildBodyPart('text/plain', payload.bodyText, alternativeBoundary) : []),
    ...(payload.bodyHtml ? buildBodyPart('text/html', payload.bodyHtml, alternativeBoundary) : []),
  ];

  const attachmentParts = (payload.attachments || []).flatMap((attachment) => buildAttachmentPart(attachment, mixedBoundary));

  const lines = [
    ...headers,
    '',
    `--${mixedBoundary}`,
    `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
    '',
    ...bodyParts,
    `--${alternativeBoundary}--`,
    '',
    ...attachmentParts,
    `--${mixedBoundary}--`,
    '',
  ];

  return lines.join(CRLF);
};
