import { KeyValueStoreActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { eventDocListsStoreName } from '../constants/eventDocListsStoreName';
import { EVENT_DOC_REPROJECT_WALK_PAGE_SIZE } from '../constants/eventDocReprojectWalkPageSize';
import { EventDocReprojectSource } from '../models';
import { askEventDocReprojectTargetsPage } from './askEventDocReprojectTargetsPage';

// The walk has to find every document of every tenant, and hand each back with the scope it lives under, or the
// reproject that follows writes one tenant's rows into another's partition.

type ScanPayload = { keyValueStoreName: string; nextPageKey?: string; options?: { limit?: number } };

const read = (source: EventDocReprojectSource, items: unknown[], nextPageKey?: string) => {
  let scanned: ScanPayload | undefined;

  const page = runStory(askEventDocReprojectTargetsPage('envelopes', source, 'from-here'), {
    [KeyValueStoreActionType.ScanAllScopes]: (action: { payload: ScanPayload }) => {
      scanned = action.payload;
      return { items, nextPageKey };
    },
  });

  return { page, scanned };
};

describe('askEventDocReprojectTargetsPage', () => {
  it('finds one document per summary row in the lists store, with its type and scope, passing over other list view rows', () => {
    const { page, scanned } = read(
      EventDocReprojectSource.Lists,
      [
        { scope: 'TENANT#a', item: { pk: 'summary#envelope', id: 'doc-1' } },
        { scope: 'TENANT#a', item: { pk: 'overview#envelope', id: 'doc-1' } },
        { scope: 'TENANT#b', item: { pk: 'summary#envelope', id: 'doc-2' } },
        { item: { pk: 'summary#packBuild', id: 'doc-3' } },
      ],
      'next',
    );

    expect(scanned).toMatchObject({
      keyValueStoreName: eventDocListsStoreName('envelopes'),
      nextPageKey: 'from-here',
      options: { limit: EVENT_DOC_REPROJECT_WALK_PAGE_SIZE },
    });
    expect(page).toEqual({
      items: [
        { type: 'envelope', docId: 'doc-1', scope: 'TENANT#a' },
        { type: 'envelope', docId: 'doc-2', scope: 'TENANT#b' },
        { type: 'packBuild', docId: 'doc-3', scope: undefined },
      ],
      nextPageKey: 'next',
    });
  });

  it('finds every row of the legacy summary store, where each row is a document', () => {
    const { page, scanned } = read(EventDocReprojectSource.LegacySummary, [
      { scope: 'TENANT#a', item: { type: 'envelope', id: 'doc-1', name: 'Lease' } },
      { item: { type: 'envelope', id: 'doc-2', name: 'Loan' } },
    ]);

    expect(scanned?.keyValueStoreName).toBe('envelopes');
    expect(page).toEqual({
      items: [
        { type: 'envelope', docId: 'doc-1', scope: 'TENANT#a' },
        { type: 'envelope', docId: 'doc-2', scope: undefined },
      ],
      nextPageKey: undefined,
    });
  });
});
