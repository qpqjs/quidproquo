import { DateActionType, DynamicFunctionsActionType, GuidActionType, KeyValueStoreActionType, KvsUpdate } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { eventDocEventsStoreName } from '../constants/eventDocEventsStoreName';
import { eventDocListsStoreName } from '../constants/eventDocListsStoreName';
import { askEventDocStoreProvide, buildEventDocStore } from '../context';
import { EventDocEffect, EventDocEvent } from '../models';
import { eventDocBaseFunctions } from '../summary/eventDocBaseFunctions';
import { askEventDocCreate } from './askEventDocCreate';

// A new document has to show in every list from the moment create returns: every list view, the summary among them,
// gets its first row from the INIT_STATE event through the same fold an append uses, with no read of the log.

const NOW = '2026-11-16T00:00:00.000Z';
const ACTOR = { userId: 'user-1', userDisplayName: 'User One' };

type Row = Record<string, unknown>;
type UpdatePayload = { keyValueStoreName: string; key: string; sortKey: string; updates: KvsUpdate };

const create = (listViewNames: string[]) => {
  const upserts: { keyValueStoreName: string; item: Row }[] = [];
  const updates: UpdatePayload[] = [];
  const folds: { viewName: string; events: EventDocEvent[]; seedState: unknown; trusted: boolean }[] = [];
  const queries: string[] = [];

  const summary = runStory(
    askEventDocStoreProvide(buildEventDocStore({ storeName: 'envelopes', type: 'envelope' }), askEventDocCreate('Lease', 'lease-1', ACTOR, 'doc-1')),
    {
      [DateActionType.Now]: NOW,
      [GuidActionType.New]: 'guid-1',
      [DynamicFunctionsActionType.Execute]: (action: { payload: { functionName: string; args: unknown[] } }) => {
        if (action.payload.functionName === 'getListViewNames') {
          return ['summary', ...listViewNames];
        }
        const [viewName, events, seedState, trusted] = action.payload.args as [string, EventDocEvent[], unknown, boolean];
        folds.push({ viewName, events, seedState, trusted });
        // The summary folds for real; a declared view answers with a stand-in state.
        return viewName === 'summary'
          ? eventDocBaseFunctions.foldListView(viewName, events, seedState, trusted)
          : { id: 'doc-1', updatedAt: NOW, status: 'building' };
      },
      [KeyValueStoreActionType.Upsert]: (action: { payload: { keyValueStoreName: string; item: Row } }) => {
        upserts.push(action.payload);
        return undefined;
      },
      [KeyValueStoreActionType.Query]: (action: { payload: { keyValueStoreName: string } }) => {
        queries.push(action.payload.keyValueStoreName);
        return { items: [], nextPageKey: undefined };
      },
      [KeyValueStoreActionType.Update]: (action: { payload: UpdatePayload }) => {
        updates.push(action.payload);
        return {};
      },
    },
  );

  return { summary, upserts, updates, folds, queries };
};

describe('askEventDocCreate', () => {
  it('opens the log with INIT_STATE and writes the summary row from it', () => {
    const { summary, upserts, updates } = create([]);

    expect(summary).toMatchObject({ id: 'doc-1', code: 'lease-1', name: 'Lease', type: 'envelope', createdBy: 'user-1', eventId: 0 });
    expect(upserts.map((upsert) => upsert.keyValueStoreName)).toEqual([eventDocEventsStoreName('envelopes')]);
    expect(updates.map((update) => [update.keyValueStoreName, update.key, update.sortKey])).toEqual([
      [eventDocListsStoreName('envelopes'), 'summary#envelope', 'doc-1'],
    ]);
  });

  it('writes the first row of every list view from the same event, trusted, without reading the log back', () => {
    const { updates, folds, queries } = create(['overview']);

    expect(folds.map((fold) => [fold.viewName, fold.seedState, fold.trusted])).toEqual([
      ['summary', null, true],
      ['overview', null, true],
    ]);
    expect(folds.every((fold) => fold.events.length === 1 && fold.events[0]?.type === EventDocEffect.InitState)).toBe(true);
    expect(updates.map((update) => update.key).sort()).toEqual(['overview#envelope', 'summary#envelope']);
    // The only reads are the looks for an existing row; the events store is never queried.
    expect(queries).toEqual([eventDocListsStoreName('envelopes'), eventDocListsStoreName('envelopes')]);
  });
});
