import { describe, expect, it } from 'vitest';

import { parseEmailMessage } from './parseEmailMessage';

const raw = (lines: string[]): Buffer => Buffer.from(lines.join('\r\n'), 'utf8');

describe('parseEmailMessage', () => {
  it('parses headers, body, delivered recipients and the provider verdicts', async () => {
    const message = await parseEmailMessage(
      raw([
        'Delivered-To: inbox-abc@inbox.development.example.com',
        'Authentication-Results: amazonses.com; spf=pass (spfCheck: domain of example.org designates 1.2.3.4 as permitted sender) client-ip=1.2.3.4; dkim=pass header.i=@example.org; dmarc=fail header.from=example.org;',
        'From: Ada <ada@example.org>',
        'To: Inbox <inbox-abc@inbox.development.example.com>, other@elsewhere.example',
        'Cc: team: bob@example.org, cat@example.org;',
        'Reply-To: replies@example.org',
        'Subject: Hello there',
        'Message-ID: <msg-1@example.org>',
        'Date: Mon, 21 Sep 2026 10:00:00 +1000',
        'Content-Type: text/plain; charset=utf-8',
        '',
        'body text',
      ]),
    );

    expect(message.recipients).toEqual(['inbox-abc@inbox.development.example.com']);
    expect(message.from).toEqual([{ address: 'ada@example.org', name: 'Ada' }]);
    expect(message.to).toEqual([{ address: 'inbox-abc@inbox.development.example.com', name: 'Inbox' }, { address: 'other@elsewhere.example' }]);
    expect(message.cc).toEqual([{ address: 'bob@example.org' }, { address: 'cat@example.org' }]);
    expect(message.replyTo).toEqual([{ address: 'replies@example.org' }]);
    expect(message.subject).toBe('Hello there');
    expect(message.text?.trim()).toBe('body text');
    expect(message.messageId).toBe('<msg-1@example.org>');
    expect(message.authentication).toEqual({ spf: 'pass', dkim: 'pass', dmarc: 'fail' });
    expect(message.attachments).toEqual([]);
  });

  it('falls back to the header recipients and empty verdicts without provider headers', async () => {
    const message = await parseEmailMessage(raw(['From: a@x.example', 'To: B@Y.example', 'Subject: s', '', 'hi']));

    expect(message.recipients).toEqual(['b@y.example']);
    expect(message.authentication).toEqual({});
  });

  it('decodes attachments to base64', async () => {
    const message = await parseEmailMessage(
      raw([
        'From: a@x.example',
        'To: b@y.example',
        'Subject: with file',
        'Content-Type: multipart/mixed; boundary="b1"',
        '',
        '--b1',
        'Content-Type: text/plain',
        '',
        'see attached',
        '--b1',
        'Content-Type: text/plain; name="note.txt"',
        'Content-Disposition: attachment; filename="note.txt"',
        'Content-Transfer-Encoding: base64',
        '',
        Buffer.from('hello').toString('base64'),
        '--b1--',
      ]),
    );

    expect(message.attachments).toEqual([{ filename: 'note.txt', mimeType: 'text/plain', base64Data: Buffer.from('hello').toString('base64') }]);
  });
});
