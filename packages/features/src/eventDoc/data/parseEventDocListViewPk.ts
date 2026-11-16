import { Nullable } from '@qpqjs/core';

import { EVENT_DOC_LIST_VIEW_KEY_SEPARATOR } from '../constants/eventDocListViewKeySeparator';

/** A lists store partition key taken apart: the list view it holds and the document type it belongs to. */
export type EventDocListViewPkParts = {
  viewName: string;
  type: string;
};

/**
 * The reverse of eventDocListViewPk, for code that walks the lists store and has only the rows. Null for a key that is
 * not one view name and one type, which a row this store wrote never has.
 */
export const parseEventDocListViewPk = (pk: string): Nullable<EventDocListViewPkParts> => {
  const [viewName, type, ...rest] = pk.split(EVENT_DOC_LIST_VIEW_KEY_SEPARATOR);

  return viewName && type && rest.length === 0 ? { viewName, type } : null;
};
