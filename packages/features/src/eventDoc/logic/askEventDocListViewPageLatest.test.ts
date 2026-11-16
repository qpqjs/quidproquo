import { askDynamicFunctionExecute, DynamicFunctionsActionType, KeyValueStoreActionType, KvsQueryCondition } from '@qpqjs/core';
import { runStory, throwsError } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { eventDocListsStoreName } from '../constants/eventDocListsStoreName';
import { askEventDocStoreProvide, buildEventDocStore } from '../context';
import { askEventDocListViewPageLatest } from './askEventDocListViewPageLatest';

// A list asks for a view by name. The name reaches a partition key, so only a list view the collection has is read,
// and what comes back is the view at the latest schema with the collection's type, never the row or its key. The
// summary goes through the same read as any other.

type QueryPayload = { keyValueStoreName: string; keyCondition: KvsQueryCondition };
type ExecutePayload = { functionName: string; args: unknown[] };

const ROWS = [
  { pk: 'overview#envelope', id: 'doc-2', updatedAt: '2026-11-02T00:00:00.000Z', eventId: 4, state: { id: 'doc-2', status: 'sent' } },
  { pk: 'overview#envelope', id: 'doc-1', updatedAt: '2026-11-01T00:00:00.000Z', eventId: 9, state: { id: 'doc-1', status: 'completed' } },
];

const read = (viewName: string, options: { registered?: boolean } = {}) => {
  const queries: QueryPayload[] = [];

  const page = runStory(
    askEventDocStoreProvide(buildEventDocStore({ storeName: 'envelopes', type: 'envelope' }), askEventDocListViewPageLatest(viewName, { limit: 2 })),
    {
      [DynamicFunctionsActionType.Execute]: (action: { payload: ExecutePayload }) => {
        if (options.registered === false) {
          return throwsError(askDynamicFunctionExecute.errorType.DynamicFunctionsNotFound, 'no definition registered');
        }
        if (action.payload.functionName === 'getListViewNames') {
          return ['summary', 'overview'];
        }
        // Stands in for the definition's climb to the latest schema.
        return (action.payload.args[1] as { id: string }[]).map((state) => ({ ...state, migrated: true }));
      },
      [KeyValueStoreActionType.Query]: (action: { payload: QueryPayload }) => {
        queries.push(action.payload);
        return { items: ROWS, nextPageKey: 'next' };
      },
    },
  );

  return { page, queries };
};

describe('askEventDocListViewPageLatest', () => {
  it('reads a declared list view from its own partition and hands back each state at the latest schema', () => {
    const { page, queries } = read('overview');

    expect(queries.map((query) => [query.keyValueStoreName, query.keyCondition.valueA])).toEqual([
      [eventDocListsStoreName('envelopes'), 'overview#envelope'],
    ]);
    expect(page).toEqual({
      items: [
        { id: 'doc-2', status: 'sent', migrated: true, type: 'envelope' },
        { id: 'doc-1', status: 'completed', migrated: true, type: 'envelope' },
      ],
      nextPageKey: 'next',
    });
  });

  it('refuses a view the collection does not declare as a list view, without reading anything', () => {
    const queries: QueryPayload[] = [];

    expect(() => {
      queries.push(...read('document').queries);
    }).toThrow(/no list view named document/);
    expect(queries).toEqual([]);
  });

  it('refuses any named view on a collection with no registered definition', () => {
    expect(() => read('overview', { registered: false })).toThrow(/no list view named overview/);
  });

  it('reads the summary the same way, and still lists it for a collection with no registered definition', () => {
    expect(read('summary').queries.map((query) => query.keyCondition.valueA)).toEqual(['summary#envelope']);

    const unregistered = read('summary', { registered: false });

    expect(unregistered.queries.map((query) => query.keyCondition.valueA)).toEqual(['summary#envelope']);
    // With nothing registered there is no schema to climb, so each state comes back as stored.
    expect(unregistered.page.items).toEqual([
      { id: 'doc-2', status: 'sent', type: 'envelope' },
      { id: 'doc-1', status: 'completed', type: 'envelope' },
    ]);
  });
});
