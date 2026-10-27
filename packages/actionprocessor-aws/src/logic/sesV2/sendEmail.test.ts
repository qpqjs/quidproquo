import { describe, expect, it, vi } from 'vitest';

import { sendEmail } from './sendEmail';

const send = vi.fn().mockResolvedValue({ MessageId: 'message-1' });

vi.mock('../createAwsClient', () => ({
  createAwsClient: () => ({ send }),
}));

describe('sendEmail', () => {
  it('sends simple content when there are no attachments', async () => {
    send.mockClear();

    const messageId = await sendEmail(
      {
        from: 'noreply@example.com',
        to: ['someone@example.com'],
        cc: ['cc@example.com'],
        bcc: ['bcc@example.com'],
        replyTo: ['support@example.com'],
        subject: 'Hello',
        bodyText: 'plain text',
        bodyHtml: '<p>plain text</p>',
      },
      'eu-west-1',
    );

    expect(messageId).toBe('message-1');
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].input).toEqual({
      FromEmailAddress: 'noreply@example.com',
      Destination: {
        ToAddresses: ['someone@example.com'],
        CcAddresses: ['cc@example.com'],
        BccAddresses: ['bcc@example.com'],
      },
      ReplyToAddresses: ['support@example.com'],
      Content: {
        Simple: {
          Subject: { Data: 'Hello', Charset: 'UTF-8' },
          Body: {
            Text: { Data: 'plain text', Charset: 'UTF-8' },
            Html: { Data: '<p>plain text</p>', Charset: 'UTF-8' },
          },
        },
      },
    });
  });

  it('omits body parts that are not provided', async () => {
    send.mockClear();

    await sendEmail(
      {
        from: 'noreply@example.com',
        to: ['someone@example.com'],
        subject: 'Hello',
        bodyText: 'plain text',
      },
      'eu-west-1',
    );

    expect(send.mock.calls[0][0].input.Content.Simple.Body).toEqual({
      Text: { Data: 'plain text', Charset: 'UTF-8' },
    });
  });

  it('sends raw MIME content when attachments exist, keeping bcc only in the Destination', async () => {
    send.mockClear();

    await sendEmail(
      {
        from: 'noreply@example.com',
        to: ['someone@example.com'],
        bcc: ['hidden@example.com'],
        subject: 'Hello',
        bodyText: 'plain text',
        attachments: [{ base64Data: 'aGVsbG8=', filename: 'hello.txt', mimetype: 'text/plain' }],
      },
      'eu-west-1',
    );

    const input = send.mock.calls[0][0].input;

    expect(input.Content.Simple).toBeUndefined();
    expect(input.Destination.BccAddresses).toEqual(['hidden@example.com']);

    const mime = new TextDecoder().decode(input.Content.Raw.Data);
    expect(mime).toContain('Content-Disposition: attachment; filename="hello.txt"');
    expect(mime).not.toContain('hidden@example.com');
  });

  it('returns an empty string when SES omits the message id', async () => {
    send.mockClear();
    send.mockResolvedValueOnce({});

    const messageId = await sendEmail(
      {
        from: 'noreply@example.com',
        to: ['someone@example.com'],
        subject: 'Hello',
        bodyText: 'plain text',
      },
      'eu-west-1',
    );

    expect(messageId).toBe('');
  });
});
