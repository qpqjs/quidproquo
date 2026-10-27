import { EmailSendEmailActionPayload } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { buildRawMimeMessage } from './buildRawMimeMessage';

const basePayload: EmailSendEmailActionPayload = {
  from: 'noreply@example.com',
  to: ['someone@example.com'],
  subject: 'Hello',
  bodyText: 'plain text',
  bodyHtml: '<p>plain text</p>',
};

describe('buildRawMimeMessage', () => {
  it('builds multipart/mixed wrapping multipart/alternative with both body parts', () => {
    const mime = buildRawMimeMessage(basePayload);

    expect(mime).toContain('Content-Type: multipart/mixed; boundary="----=_qpq_mixed"');
    expect(mime).toContain('Content-Type: multipart/alternative; boundary="----=_qpq_alternative"');
    expect(mime).toContain('Content-Type: text/plain; charset=UTF-8');
    expect(mime).toContain('Content-Type: text/html; charset=UTF-8');
    expect(mime).toContain('From: noreply@example.com');
    expect(mime).toContain('To: someone@example.com');
    expect(mime).toContain('Subject: Hello');
    expect(mime).toContain(Buffer.from('plain text', 'utf8').toString('base64'));
    expect(mime.endsWith('------=_qpq_mixed--\r\n')).toBe(true);
  });

  it('adds attachments as base64 parts wrapped at 76 characters', () => {
    const base64Data = Buffer.from('a'.repeat(100), 'utf8').toString('base64');
    const mime = buildRawMimeMessage({
      ...basePayload,
      attachments: [{ base64Data, filename: 'a.txt', mimetype: 'text/plain' }],
    });

    expect(mime).toContain('Content-Type: text/plain; name="a.txt"');
    expect(mime).toContain('Content-Disposition: attachment; filename="a.txt"');

    const base64Lines = mime.split('\r\n').filter((line) => base64Data.startsWith(line) && line.length > 0);
    expect(base64Lines[0]).toHaveLength(76);
  });

  it('defaults attachment mimetype and honours a contentDisposition override', () => {
    const mime = buildRawMimeMessage({
      ...basePayload,
      attachments: [{ base64Data: 'aGVsbG8=', filename: 'raw.bin', contentDisposition: 'inline' }],
    });

    expect(mime).toContain('Content-Type: application/octet-stream; name="raw.bin"');
    expect(mime).toContain('Content-Disposition: inline');
  });

  it('never emits a Bcc header', () => {
    const mime = buildRawMimeMessage({ ...basePayload, bcc: ['hidden@example.com'] });

    expect(mime).not.toContain('Bcc');
    expect(mime).not.toContain('hidden@example.com');
  });

  it('strips CR/LF from header values so callers cannot inject headers', () => {
    const mime = buildRawMimeMessage({ ...basePayload, subject: 'Hi\r\nBcc: sneaky@example.com' });

    expect(mime).toContain('Subject: Hi Bcc: sneaky@example.com');
    expect(mime).not.toContain('\r\nBcc:');
  });

  it('encodes non-ascii subjects as RFC 2047 encoded-words', () => {
    const mime = buildRawMimeMessage({ ...basePayload, subject: 'Héllo 👋' });

    expect(mime).toContain(`Subject: =?UTF-8?B?${Buffer.from('Héllo 👋', 'utf8').toString('base64')}?=`);
  });

  it('includes Cc and Reply-To headers when provided', () => {
    const mime = buildRawMimeMessage({
      ...basePayload,
      cc: ['cc1@example.com', 'cc2@example.com'],
      replyTo: ['support@example.com'],
    });

    expect(mime).toContain('Cc: cc1@example.com, cc2@example.com');
    expect(mime).toContain('Reply-To: support@example.com');
  });
});
