import { ActionHistory, StoryResult } from 'quidproquo-core';
import { EmailActionType, EmailDeliveryStatus } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { emailEntityDefinition } from './emailEntityDefinition';
import { emailSetDeliveryStatusActionSearchDefinition } from './emailSetDeliveryStatusActionSearchDefinition';

const storyResult = { correlation: 'corr-2', history: [] } as unknown as StoryResult<any>;

const statusEntry = (deliveryStatus: EmailDeliveryStatus, reason?: string): ActionHistory => ({
  act: {
    type: EmailActionType.SetDeliveryStatus,
    payload: { messageId: 'msg-123', deliveryStatus, reason },
  },
  res: [undefined],
  startedAt: '2026-07-24T00:05:00.000Z',
  finishedAt: '2026-07-24T00:05:00.001Z',
});

describe('emailSetDeliveryStatusActionSearchDefinition', () => {
  it('extracts the status event with the messageId as the link key', () => {
    const extracted = emailSetDeliveryStatusActionSearchDefinition.action.extract(statusEntry(EmailDeliveryStatus.delivered), storyResult, 0);

    expect(extracted).toEqual({
      fields: {
        messageId: 'msg-123',
        deliveryStatus: EmailDeliveryStatus.delivered,
      },
      linkKey: 'email#msg-123',
    });
  });

  it('carries the provider reason when present', () => {
    const extracted = emailSetDeliveryStatusActionSearchDefinition.action.extract(
      statusEntry(EmailDeliveryStatus.deferred, '421 try again later'),
      storyResult,
      0,
    );

    expect(extracted?.fields.reason).toBe('421 try again later');
  });

  it('shares the email entity definition with the send action', () => {
    expect(emailSetDeliveryStatusActionSearchDefinition.entity).toBe(emailEntityDefinition);
  });
});
