import { Nullable, QpqPagedData } from 'quidproquo-core';
import { ActionSearchFilter } from 'quidproquo-features';

import { useState } from 'react';

import { usePlatformApiPost } from '../../view/hooks/useAsyncRequest';
import { ActionSearchView } from '../types/ActionSearchView';

// Matches the events search cap so a wide-open query can't page forever
const MAX_RESULTS = 3000;

export type ActionSearchResultRow = Record<string, unknown>;

type ActionSearchResults = {
  viewKey: string;
  rows: ActionSearchResultRow[];
};

export const useActionSearch = (view: Nullable<ActionSearchView>) => {
  const listActionRows = usePlatformApiPost<QpqPagedData<ActionSearchResultRow>>('/actionSearch/actions/list');
  const listEntityRows = usePlatformApiPost<QpqPagedData<ActionSearchResultRow>>('/actionSearch/entities/list');

  const [results, setResults] = useState<ActionSearchResults>({ viewKey: '', rows: [] });
  const [isSearching, setIsSearching] = useState(false);

  const runSearch = async (startIsoDateTime: string, endIsoDateTime: string, filters: ActionSearchFilter[]): Promise<void> => {
    if (!view) {
      return;
    }

    setIsSearching(true);
    try {
      const collected: ActionSearchResultRow[] = [];
      let nextPageKey: string | undefined = undefined;

      do {
        const request: Record<string, unknown> = {
          ...(view.kind === 'action' ? { actionType: view.key } : { entityType: view.key }),
          startIsoDateTime,
          endIsoDateTime,
          filters,
          nextPageKey,
        };

        const page: QpqPagedData<ActionSearchResultRow> = view.kind === 'action' ? await listActionRows(request) : await listEntityRows(request);

        collected.push(...page.items);
        nextPageKey = page.nextPageKey;
      } while (nextPageKey && collected.length < MAX_RESULTS);

      setResults({ viewKey: view.key, rows: collected });
    } finally {
      setIsSearching(false);
    }
  };

  // Rows are tagged with the view that produced them. Deriving (not clearing in an
  // effect) matters: an effect runs after render, so the first render after a view
  // switch would still hand the old rows to the new view's columns and crash.
  const rows = view && results.viewKey === view.key ? results.rows : [];

  return { rows, isSearching, runSearch };
};
