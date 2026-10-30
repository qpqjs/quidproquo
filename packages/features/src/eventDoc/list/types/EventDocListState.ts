import { Nullable } from '@qpqjs/core';

import { EventDocSummary } from '../../models';
import { EventDocListConfig } from './EventDocListConfig';

/** A cursor-paged list: `items` is the current page only, and pages are walked (next/previous), not addressed. */
export type EventDocListState = EventDocListConfig & {
  items: EventDocSummary[];
  isLoading: boolean;
  error: Nullable<string>;
  // 0-based position in the walk; display only.
  pageIndex: number;
  // cursors[i] loads page i (cursors[0] is always null). Kept so Previous can re-fetch a page already walked past.
  cursors: Nullable<string>[];
  // Cursor for the page after the current one; null means last page. The only correct "is there more" signal:
  // soft-deleted rows are filtered after the read, so a short page does not mean the end.
  nextPageKey: Nullable<string>;
  pageSize: number;
};
