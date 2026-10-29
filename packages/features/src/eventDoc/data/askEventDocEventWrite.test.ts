import { ContextActionType, KeyValueStoreActionType, QpqIsoDateTime } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askEventDocProvideStore } from '../context/askEventDocProvideStore';
import { EventDocEvent } from '../models';
import { askEventDocEventWrite } from './askEventDocEventWrite';

const EVENT: EventDocEvent = {
  type: 'rename',
  payload: {
    data: { name: 'x' },
    metadata: {
      version: 1,
      clientMessageId: 'msg-1',
      createdBy: { userId: 'user-1', userDisplayName: 'User One' },
      createdAt: '2026-10-14T00:00:00.000Z' as QpqIsoDateTime,
      eventId: 8,
    },
  },
};

type UpsertPayload = { keyValueStoreName: string; item: Record<string, unknown>; options?: { ifNotExists?: boolean; scope?: string } };

// Security regression: an event claims its (doc, id) slot with a conditional write under the request's scope, so a
// replay or a concurrent writer can never overwrite an existing event or land it in another partition.
describe('askEventDocEventWrite', () => {
  it('writes with ifNotExists under the ambient scope', () => {
    let payload: UpsertPayload | undefined;

    runStory(askEventDocProvideStore({ storeName: 'templates', type: 'template' }, askEventDocEventWrite('doc-1', EVENT)), {
      [ContextActionType.Read]: 'TENANT#tenant-a',
      [KeyValueStoreActionType.Upsert]: (action: { payload: UpsertPayload }) => {
        payload = action.payload;
        return undefined;
      },
    });

    expect(payload?.options?.ifNotExists).toBe(true);
    expect(payload?.options?.scope).toBe('TENANT#tenant-a');
    expect(payload?.item).toMatchObject({ pk: 'doc-1', sk: 8 });
  });
});
