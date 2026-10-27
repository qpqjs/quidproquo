import { askKeyValueStoreQuery, KeyValueStoreQueryOptions, KvsQueryOperation } from '../../actions';
import { AskResponse, QpqPagedData } from '../../types';

type KeyValueStoreQueryAllOptions = Omit<KeyValueStoreQueryOptions, 'nextPageKey'>;

export function* askKeyValueStoreQueryAll<T>(
  keyValueStoreName: string,
  keyCondition: KvsQueryOperation,
  options?: KeyValueStoreQueryAllOptions,
): AskResponse<T[]> {
  const allData: T[] = [];
  let data: QpqPagedData<T> = {
    items: [],
  };

  do {
    data = yield* askKeyValueStoreQuery<T>(keyValueStoreName, keyCondition, {
      ...(options || {}),
      nextPageKey: data.nextPageKey,
    });

    allData.push(...data.items);
  } while (data.nextPageKey);

  return allData;
}
