import { KeyValueStoreQPQConfigSetting, KvsIndex, Nullable } from 'quidproquo-core';

import { getKvsItemPk } from './getKvsItemPk';
import { getKvsItemSk } from './getKvsItemSk';

/**
 * The opaque nextPageKey cursor: base64 of the last returned item's {pk, sk}, plus its index sort key
 * value when the page was read through a GSI (whose sort key leads the order). One codec shared by
 * every engine, so cursors survive an engine swap.
 */
export type KvsPageCursor = {
  pk: any;
  sk: any;
  indexSk?: any;
};

export const decodeKvsPageCursor = (nextPageKey: string): KvsPageCursor => JSON.parse(Buffer.from(nextPageKey, 'base64').toString());

export const encodeKvsPageCursor = (item: any, storeConfig: KeyValueStoreQPQConfigSetting, index: Nullable<KvsIndex> = null): string => {
  const cursor: KvsPageCursor = {
    pk: getKvsItemPk(item, storeConfig),
    sk: getKvsItemSk(item, storeConfig),
    ...(index?.sortKey ? { indexSk: item[index.sortKey.key] } : {}),
  };

  return Buffer.from(JSON.stringify(cursor)).toString('base64');
};
