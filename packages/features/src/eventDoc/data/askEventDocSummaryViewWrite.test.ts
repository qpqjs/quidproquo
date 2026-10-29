import {
  askKeyValueStoreUpdateBase,
  KeyValueStoreActionType,
  kvsLessThan,
  kvsNotExists,
  kvsOr,
  KvsUpdate,
  KvsUpdateActionType,
  QpqIsoDateTime,
} from '@qpqjs/core';
import { runStory, throwsError } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askEventDocProvideStore } from '../context/askEventDocProvideStore';
import { EventDocSummaryView } from '../models';
import { askEventDocSummaryViewWrite } from './askEventDocSummaryViewWrite';

// The summary row is a projection two writers race for (the append path and the stream projector), so the write
// itself carries the ordering guard: only land over a row with no eventId or an older one than the view's.

const VIEW: EventDocSummaryView = {
  id: 'doc-1',
  code: 'tpl-1',
  name: 'Template One',
  createdAt: '2026-10-14T00:00:00.000Z' as QpqIsoDateTime,
  updatedAt: '2026-10-14T00:00:01.000Z' as QpqIsoDateTime,
  createdBy: 'user-1',
  updatedBy: 'user-1',
  versions: [{ version: 1, eventId: 7 }],
  eventId: 7,
};

type UpdatePayload = { keyValueStoreName: string; key: unknown; sortKey?: unknown; updates: KvsUpdate; options?: { condition?: unknown } };

const write = (onUpdate: (payload: UpdatePayload) => unknown) =>
  runStory(askEventDocProvideStore({ storeName: 'templates', type: 'template' }, askEventDocSummaryViewWrite('doc-1', VIEW)), {
    [KeyValueStoreActionType.Update]: (action: { payload: UpdatePayload }) => onUpdate(action.payload),
  });

describe('askEventDocSummaryViewWrite', () => {
  it('writes the view with its event id and guards the write on it', () => {
    let payload: UpdatePayload | undefined;

    const written = write((p) => {
      payload = p;
      return {};
    });

    expect(written).toBe(true);
    expect(payload?.key).toBe('template');
    expect(payload?.sortKey).toBe('doc-1');
    expect(payload?.updates).toContainEqual({ attributePath: 'eventId', action: KvsUpdateActionType.Set, value: 7 });
    expect(payload?.options?.condition).toEqual(kvsOr([kvsNotExists('eventId'), kvsLessThan('eventId', 7)]));
  });

  it('reports a refused write as false rather than failing', () => {
    const written = write(() => throwsError(askKeyValueStoreUpdateBase.errorType.ConditionFailed, 'newer row stored'));

    expect(written).toBe(false);
  });

  it('rethrows any other failure', () => {
    expect(() => write(() => throwsError(askKeyValueStoreUpdateBase.errorType.ServiceUnavailable, 'throttled'))).toThrow(/throttled/);
  });
});
