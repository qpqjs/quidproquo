import { KeyValueStoreQPQConfigSetting, QpqPagedData } from 'quidproquo-core';

import { getKvsItemPk } from './getKvsItemPk';
import { getKvsItemSk } from './getKvsItemSk';
import { decodeKvsPageCursor, encodeKvsPageCursor } from './kvsPageCursor';

// Items are held in memory with their native JS types (a numeric sort key is a
// real `number`, not a stringified column), so plain `<`/`>` already orders
// numeric and string keys correctly - no separate numeric-vs-lexical branch.
const compareValues = (a: any, b: any): number => {
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
};

export const compareKvsItemKeys = (aPk: any, aSk: any, bPk: any, bSk: any): number => {
  const pkCmp = compareValues(aPk, bPk);
  return pkCmp !== 0 ? pkCmp : compareValues(aSk, bSk);
};

/**
 * Sort by pk then sk (either direction) and apply {pk, sk} cursor pagination,
 * fetching one extra row to detect hasMore.
 */
export const paginateKvsItems = (
  items: any[],
  storeConfig: KeyValueStoreQPQConfigSetting,
  sortAscending: boolean,
  nextPageKey?: string,
  limit?: number,
): QpqPagedData<any> => {
  const sorted = [...items].sort((a, b) => {
    const cmp = compareKvsItemKeys(getKvsItemPk(a, storeConfig), getKvsItemSk(a, storeConfig), getKvsItemPk(b, storeConfig), getKvsItemSk(b, storeConfig));
    return sortAscending ? cmp : -cmp;
  });

  const cursor = nextPageKey ? decodeKvsPageCursor(nextPageKey) : undefined;
  const afterCursor = cursor
    ? sorted.filter((item) => {
        const cmp = compareKvsItemKeys(getKvsItemPk(item, storeConfig), getKvsItemSk(item, storeConfig), cursor.pk, cursor.sk);
        return sortAscending ? cmp > 0 : cmp < 0;
      })
    : sorted;

  const pageSize = limit || 100;
  const page = afterCursor.slice(0, pageSize + 1);
  const hasMore = page.length > pageSize;
  const resultItems = page.slice(0, pageSize);

  return {
    items: resultItems,
    nextPageKey: hasMore ? encodeKvsPageCursor(resultItems[resultItems.length - 1], storeConfig) : undefined,
  };
};
