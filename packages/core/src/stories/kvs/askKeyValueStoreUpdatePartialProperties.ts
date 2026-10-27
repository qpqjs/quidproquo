import { askKeyValueStoreUpdate, KeyValueStoreUpdateOptions, kvsRemove, kvsSet, kvsUpdate, KvsUpdateAction } from '../../actions';
import { AskResponse } from '../../types';
import { isValidKvsAdvancedDataType } from './utils';

export enum InvalidKvsPartialPropertyErrorCode {
  // The property value is not a KvsAdvancedDataType, so kvsSet cannot store it.
  unsupportedValueType = 'unsupportedValueType',
}

// Thrown instead of silently dropping a property whose value kvsSet cannot store
// (e.g. a nested object): a silent drop looks to the caller like a successful write.
export class InvalidKvsPartialPropertyError extends Error {
  constructor(
    public readonly code: InvalidKvsPartialPropertyErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'InvalidKvsPartialPropertyError';
  }
}

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
      throw new InvalidKvsPartialPropertyError(
        InvalidKvsPartialPropertyErrorCode.unsupportedValueType,
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
