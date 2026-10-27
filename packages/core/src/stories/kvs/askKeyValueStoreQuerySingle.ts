import { askKeyValueStoreQuery, KvsQueryOperation } from '../../actions';
import { AskResponse, QpqPagedData } from '../../types';

export function* askKeyValueStoreQuerySingle<T>(
  keyValueStoreName: string,
  keyCondition: KvsQueryOperation,
  filter?: KvsQueryOperation,
  sortAscending?: boolean,
  limit = 1,
  scope?: string,
): AskResponse<T | null> {
  const allData: T[] = [];
  let data: QpqPagedData<T> = {
    items: [],
  };

  // filters apply AFTER you get the limit of the data so do pagination
  do {
    data = yield* askKeyValueStoreQuery<T>(keyValueStoreName, keyCondition, {
      filter,
      limit,
      sortAscending,
      nextPageKey: data.nextPageKey,
      scope,
    });

    allData.push(...data.items);
  } while (data.nextPageKey && allData.length < limit);

  // Return the first collected item: the last fetched page can be empty (or hold a
  // later match) even when an earlier page already produced the item we want.
  return allData.length > 0 ? allData[0] : null;
}
