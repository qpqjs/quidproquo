import { EmailActionType, EmailDeliveryStatus } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { ActionSearchActionRow } from '../../domain/ActionSearchActionRow';
import { ActionSearchEntityRow } from '../../domain/ActionSearchEntityRow';
import { emailEntityDefinition } from './emailEntityDefinition';

const sendRow = (overrides: Partial<ActionSearchActionRow>): ActionSearchActionRow => ({
  correlation: 'corr-1',
  actionIndex: 0,
  actionType: EmailActionType.SendEmail,
  startedAt: '2026-07-24T00:00:02.000Z',
  moduleName: 'test-service',
  executionTimeMs: 100,
  from: 'noreply@x.com',
  to: 'joe@x.com, amy@x.com',
  cc: 'ops@x.com',
  subject: 'Welcome',
  deliveryStatus: EmailDeliveryStatus.sent,
  messageId: 'msg-123',
  linkKey: 'email#msg-123',
  ...overrides,
});

const statusRow = (overrides: Partial<ActionSearchActionRow>): ActionSearchActionRow => ({
  correlation: 'corr-2',
  actionIndex: 0,
  actionType: EmailActionType.SetDeliveryStatus,
  startedAt: '2026-07-24T00:05:00.000Z',
  moduleName: 'test-service',
  executionTimeMs: 1,
  messageId: 'msg-123',
  deliveryStatus: EmailDeliveryStatus.delivered,
  linkKey: 'email#msg-123',
  ...overrides,
});

describe('emailEntityDefinition', () => {
  it('folds order-independently', () => {
    const rows = [sendRow({}), sendRow({ actionIndex: 1, correlation: 'corr-3', startedAt: '2026-07-24T00:00:01.000Z', subject: 'Retry' })];

    const folded = emailEntityDefinition.fold(rows);
    const foldedShuffled = emailEntityDefinition.fold([...rows].reverse());

    expect(foldedShuffled).toEqual(folded);
    expect(folded.sentAt).toBe('2026-07-24T00:00:01.000Z');
    expect(folded.subject).toBe('Retry');
  });

  it('lets a delivery event outrank the initial sent status, keeping its reason', () => {
    const rows = [sendRow({}), statusRow({ deliveryStatus: EmailDeliveryStatus.bounce, reason: '550 mailbox unavailable' })];

    const folded = emailEntityDefinition.fold(rows);
    const foldedShuffled = emailEntityDefinition.fold([...rows].reverse());

    expect(folded.deliveryStatus).toBe(EmailDeliveryStatus.bounce);
    expect(folded.reason).toBe('550 mailbox unavailable');
    expect(foldedShuffled).toEqual(folded);
  });

  it('keeps the send fields when a status event arrives before the send', () => {
    // Only the status event has landed so far
    const statusOnly = emailEntityDefinition.fold([statusRow({})]);
    expect(statusOnly.deliveryStatus).toBe(EmailDeliveryStatus.delivered);
    expect(statusOnly.subject).toBeUndefined();

    // The send's story lands later and the refold fills in the rest
    const complete = emailEntityDefinition.fold([statusRow({}), sendRow({})]);
    expect(complete.subject).toBe('Welcome');
    expect(complete.deliveryStatus).toBe(EmailDeliveryStatus.delivered);
    expect(complete.sentAt).toBe('2026-07-24T00:00:02.000Z');
  });

  it('keeps the latest reason across repeated same-rank events', () => {
    const rows = [
      statusRow({ deliveryStatus: EmailDeliveryStatus.deferred, reason: 'first attempt', startedAt: '2026-07-24T00:01:00.000Z' }),
      statusRow({ deliveryStatus: EmailDeliveryStatus.deferred, reason: 'second attempt', startedAt: '2026-07-24T00:02:00.000Z', actionIndex: 1 }),
    ];

    expect(emailEntityDefinition.fold(rows).reason).toBe('second attempt');
    expect(emailEntityDefinition.fold([...rows].reverse()).reason).toBe('second attempt');
  });

  it('derives deduplicated recipient lookup keys from to and cc', () => {
    const entity: ActionSearchEntityRow = {
      linkKey: 'email#msg-123',
      entityType: 'email',
      createdAt: '2026-07-24T00:00:02.000Z',
      to: 'joe@x.com, amy@x.com',
      cc: 'ops@x.com, joe@x.com',
    };

    expect(emailEntityDefinition.lookupKeys(entity)).toEqual(['recipient#joe@x.com', 'recipient#amy@x.com', 'recipient#ops@x.com']);
  });
});
