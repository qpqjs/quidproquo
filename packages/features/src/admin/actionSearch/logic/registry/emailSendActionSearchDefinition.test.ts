import { ActionHistory, StoryResult } from 'quidproquo-core';
import { EmailActionType, EmailDeliveryStatus } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { emailSendActionSearchDefinition } from './emailSendActionSearchDefinition';

const storyResult = { correlation: 'corr-1', history: [] } as unknown as StoryResult<any>;

const emailEntry = (res: unknown): ActionHistory => ({
  act: {
    type: EmailActionType.SendEmail,
    payload: {
      from: 'noreply@x.com',
      to: ['joe@x.com', 'amy@x.com'],
      cc: ['ops@x.com'],
      subject: 'Welcome',
      bodyText: 'hi',
    },
  },
  res,
  startedAt: '2026-07-24T00:00:02.000Z',
  finishedAt: '2026-07-24T00:00:02.100Z',
});

describe('emailSendActionSearchDefinition', () => {
  it('extracts a sent email with the messageId as the link key', () => {
    const extracted = emailSendActionSearchDefinition.action.extract(emailEntry(['msg-123']), storyResult, 0);

    expect(extracted).toEqual({
      fields: {
        from: 'noreply@x.com',
        to: 'joe@x.com, amy@x.com',
        cc: 'ops@x.com',
        subject: 'Welcome',
        deliveryStatus: EmailDeliveryStatus.sent,
        messageId: 'msg-123',
      },
      linkKey: 'email#msg-123',
    });
  });

  it('marks a failed send as dropped with the error as the reason, keyed by origin', () => {
    const entry = emailEntry([undefined, { errorType: 'MessageRejected', errorText: 'rejected' }]);

    const extracted = emailSendActionSearchDefinition.action.extract(entry, storyResult, 3);

    expect(extracted?.fields.deliveryStatus).toBe(EmailDeliveryStatus.dropped);
    expect(extracted?.fields.reason).toBe('rejected');
    expect(extracted?.fields.messageId).toBeUndefined();
    expect(extracted?.linkKey).toBe('email#corr-1#3');
  });
});
