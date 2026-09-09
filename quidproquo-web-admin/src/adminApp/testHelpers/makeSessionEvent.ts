import { QpqIsoDateTime } from 'quidproquo-core';
import { EventDocEffect, EventDocEvent } from 'quidproquo-features';

import { adminSessionSchemaVersion } from '../constants/adminSessionSchemaVersion';

// Builds a session event with sensible metadata defaults for tests.
export const makeSessionEvent = <T>(
  type: string,
  data: T,
  index: number,
  overrides?: { clientMessageId?: string; createdAt?: QpqIsoDateTime },
): EventDocEvent => ({
  type,
  payload: {
    data,
    metadata: {
      version: adminSessionSchemaVersion,
      clientMessageId: overrides?.clientMessageId ?? `cmid-${index}`,
      createdBy: { userId: 'test-user', userDisplayName: 'Test User' },
      createdAt: overrides?.createdAt ?? (`2026-07-07T00:00:0${Math.min(index, 9)}.000Z` as QpqIsoDateTime),
      eventId: index,
    },
  },
});

export const makeInitStateEvent = (id: string, name: string): EventDocEvent =>
  makeSessionEvent(EventDocEffect.InitState, { id, code: 'session-code', name }, 0);
