import { askKeyValueStoreScan, KeyValueStoreScanOptions, KvsQueryOperation } from '../../actions';
import { AskResponse, QpqPagedData } from '../../types';

export function* askKeyValueStoreScanAll<T>(
  storeName: string,
  filterCondition?: KvsQueryOperation,
  options?: KeyValueStoreScanOptions,
): AskResponse<T[]> {
  const allData: T[] = [];
  let data: QpqPagedData<T> = {
    items: [],
  };

  do {
    // Forward the options (including any scope) on every page, not just the first
    data = yield* askKeyValueStoreScan<T>(storeName, filterCondition, data.nextPageKey, options);

    allData.push(...data.items);
  } while (data.nextPageKey);

  return allData;
}
