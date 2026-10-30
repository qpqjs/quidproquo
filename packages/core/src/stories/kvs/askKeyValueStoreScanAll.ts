import { askKeyValueStoreScan, KeyValueStoreScanOptions, KvsQueryOperation } from '../../actions';
import { AskResponse } from '../../types';
import { askPagedDataDrain } from '../paging/askPagedDataDrain';

export function* askKeyValueStoreScanAll<T>(
  storeName: string,
  filterCondition?: KvsQueryOperation,
  options?: KeyValueStoreScanOptions,
): AskResponse<T[]> {
  // Forward the options (including any scope) on every page, not just the first
  const { items } = yield* askPagedDataDrain<T>(function* askScanPage(nextPageKey) {
    return yield* askKeyValueStoreScan<T>(storeName, filterCondition, nextPageKey, options);
  });

  return items;
}
