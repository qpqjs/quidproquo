import { askKeyValueStoreUpsert, askKeyValueStoreUpsertBase, askThrowError, KeyValueStoreUpsertOptions } from '../../actions';
import { AskResponse } from '../../types';
import { askRetry } from '../askRetry';

export type KeyValueStoreUpsertWithRetryOptions = KeyValueStoreUpsertOptions & {
  maxRetries?: number; // default 3
};

export function* askKeyValueStoreUpsertWithRetry<KvsItem>(
  keyValueStoreName: string,
  item: KvsItem,
  options?: KeyValueStoreUpsertWithRetryOptions,
): AskResponse<void> {
  const { maxRetries = 3, ...kvsOptions } = options || {};

  const upsertResponse = yield* askRetry(
    function* askRunLogic() {
      return yield* askKeyValueStoreUpsert<KvsItem>(keyValueStoreName, item, kvsOptions);
    },
    maxRetries,
    250,
    // Both transient: the service is throttling, or another write holds the item for the
    // moment. Conflict (the item exists) is final and passes straight through.
    [askKeyValueStoreUpsertBase.errorType.ServiceUnavailable, askKeyValueStoreUpsertBase.errorType.WriteContention],
  );

  if (!upsertResponse.success) {
    yield* askThrowError(upsertResponse.error.errorType, upsertResponse.error.errorText, upsertResponse.error.errorStack);
  }
}
