import { KeyValueStoreActionType, KeyValueStoreQueryOptions, KvsQueryOperation, QpqIsoDateTime } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { eventDocListsStoreName } from '../constants/eventDocListsStoreName';
import { askEventDocStoreProvide, buildEventDocStore } from '../context';
import { EventDocSummaryView } from '../models';
import { createEventDocSummarySeed } from '../summary/logic/createEventDocSummarySeed';
import { buildEventDocSummaryRow } from '../testing/buildEventDocSummaryRow';
import { askEventDocListPage } from './askEventDocListPage';

type QueryPayload = { keyValueStoreName: string; keyCondition: KvsQueryOperation; options?: KeyValueStoreQueryOptions };

const SUMMARY: EventDocSummaryView = {
  // The base fields every view carries, at their starting values; the summary's own are set below.
  ...createEventDocSummarySeed(),
  id: 'doc-1',
  code: 'c-1',
  name: 'Content One',
  createdAt: '2026-10-14T00:00:00.000Z' as QpqIsoDateTime,
  updatedAt: '2026-10-14T00:00:01.000Z' as QpqIsoDateTime,
  createdBy: 'user-1',
  updatedBy: 'user-1',
  versions: [{ version: 1, eventId: 3 }],
  eventId: 3,
};

const listPage = (onQuery: (payload: QueryPayload) => void = () => undefined) =>
  runStory(askEventDocStoreProvide(buildEventDocStore({ storeName: 'content', type: 'content' }), askEventDocListPage()), {
    [KeyValueStoreActionType.Query]: (action: { payload: QueryPayload }) => {
      onQuery(action.payload);
      return { items: [buildEventDocSummaryRow('content', SUMMARY)], nextPageKey: 'next' };
    },
  });

describe('askEventDocListPage', () => {
  it('reads the summary view newest first through the (pk, updatedAt) index, which it has to name because it shares the table pk', () => {
    let captured: QueryPayload | undefined;

    listPage((payload) => {
      captured = payload;
    });

    expect(captured?.keyValueStoreName).toBe(eventDocListsStoreName('content'));
    expect(captured?.keyCondition).toEqual({ key: 'pk', operation: 'Equal', valueA: 'summary#content' });
    expect(captured?.options).toMatchObject({ indexName: 'pk', sortAscending: false });
  });

  it('hands back each row as a summary with its type, keeping the page cursor', () => {
    expect(listPage()).toEqual({ items: [{ ...SUMMARY, type: 'content' }], nextPageKey: 'next' });
  });
});
