import { askKeyValueStoreQuery, KeyValueStoreQueryOptions, KvsQueryOperation } from '../../actions';
import { AskResponse } from '../../types';
import { askPagedDataDrain } from '../paging/askPagedDataDrain';

type KeyValueStoreQueryAllOptions = Omit<KeyValueStoreQueryOptions, 'nextPageKey'>;

export function* askKeyValueStoreQueryAll<T>(
  keyValueStoreName: string,
  keyCondition: KvsQueryOperation,
  options?: KeyValueStoreQueryAllOptions,
): AskResponse<T[]> {
  const { items } = yield* askPagedDataDrain<T>(function* askQueryPage(nextPageKey) {
    return yield* askKeyValueStoreQuery<T>(keyValueStoreName, keyCondition, { ...(options || {}), nextPageKey });
  });

  return items;
}
