import { KeyValueStoreQPQConfigSetting } from 'quidproquo-core';

import { getKvsItemPk } from './getKvsItemPk';
import { getKvsItemSk } from './getKvsItemSk';

/**
 * The opaque nextPageKey cursor: base64 of the last returned item's {pk, sk}.
 * One codec shared by every engine, so cursors survive an engine swap.
 */
export type KvsPageCursor = {
  pk: any;
  sk: any;
};

export const decodeKvsPageCursor = (nextPageKey: string): KvsPageCursor => JSON.parse(Buffer.from(nextPageKey, 'base64').toString());

export const encodeKvsPageCursor = (item: any, storeConfig: KeyValueStoreQPQConfigSetting): string =>
  Buffer.from(JSON.stringify({ pk: getKvsItemPk(item, storeConfig), sk: getKvsItemSk(item, storeConfig) } as KvsPageCursor)).toString('base64');
