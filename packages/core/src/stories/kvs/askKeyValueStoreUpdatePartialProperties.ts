import { askKeyValueStoreUpdate, askThrowError, KeyValueStoreUpdateOptions, kvsRemove, kvsSet, kvsUpdate, KvsUpdateAction } from '../../actions';
import { AskResponse, ErrorTypeEnum } from '../../types';
import { isValidKvsAdvancedDataType } from './utils';

export function askKeyValueStoreUpdatePartialProperties<TModel extends Record<string, any>, PartitionKey extends keyof TModel>(
  keyValueStoreName: string,
  partitionKeyName: PartitionKey,
  partialProperties: Partial<TModel> & {
    [key in PartitionKey]: TModel[PartitionKey];
  },
  sortKeyName?: undefined,
  options?: KeyValueStoreUpdateOptions,
): AskResponse<TModel>;

export function askKeyValueStoreUpdatePartialProperties<
  TModel extends Record<string, any>,
  PartitionKey extends keyof TModel,
  SortKey extends keyof TModel,
>(
  keyValueStoreName: string,
  partitionKeyName: PartitionKey,
  partialProperties: Partial<TModel> & {
    [key in PartitionKey]: TModel[PartitionKey];
  } & { [key in SortKey]: TModel[SortKey] },
  sortKeyName: SortKey,
  options?: KeyValueStoreUpdateOptions,
): AskResponse<TModel>;

export function* askKeyValueStoreUpdatePartialProperties<TModel extends Record<string, any>, PartitionKey extends keyof TModel>(
  keyValueStoreName: string,
  partitionKeyName: PartitionKey,
  partialProperties: Partial<TModel> & {
    [key in PartitionKey]: TModel[PartitionKey];
  },
  sortKeyName?: keyof TModel,
  options?: KeyValueStoreUpdateOptions,
): AskResponse<TModel> {
  const operations: KvsUpdateAction[] = [];

  for (const [key, value] of Object.entries(partialProperties)) {
    // The key attributes address the item; they are never part of the update operations
    if (key === partitionKeyName || key === sortKeyName) {
      continue;
    }

    if (value === undefined) {
      operations.push(kvsRemove(key));
      continue;
    }

    if (!isValidKvsAdvancedDataType(value)) {
      return yield* askThrowError(
        ErrorTypeEnum.Invalid,
        `Cannot update property "${key}" on store "${keyValueStoreName}": the value is not a supported kvs data type`,
      );
    }

    operations.push(kvsSet(key, value));
  }

  return yield* askKeyValueStoreUpdate<TModel>(
    keyValueStoreName,
    kvsUpdate(operations),
    partialProperties[partitionKeyName],
    sortKeyName ? partialProperties[sortKeyName] : undefined,
    options,
  );
}
