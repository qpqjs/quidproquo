import { KeyOf } from '../../../types';
import { QPQCoreConfigSettingType } from '../../QPQConfig';
import { CompositeCompositeKvsIndex, CompositeKvsIndex, CompositeKvsKey } from './types/CompositeKvsIndex';
import { KeyValueStoreQPQConfigSetting } from './types/KeyValueStoreQPQConfigSetting';
import { KvsIndex } from './types/KvsIndex';
import { KvsKey } from './types/KvsKey';
import { QPQConfigAdvancedKeyValueStoreSettings } from './types/QPQConfigAdvancedKeyValueStoreSettings';
import { kvsKey } from './kvsKey';

// TODO: @joe-coady: When we put validation on the QPQConfig, we need to make sure
// Key Length and Data Type: DynamoDB has limitations on key length and data type.
// Your KvsKeyType only supports 'string', 'number', and 'binary' types. Make sure
// that you're validating these in convertKvsKeyToDynamodbAttribute function and
// also ensure that key length is within DynamoDB's specified limits.

const convertCompositeKvsKeyToKvsKey = <T extends object = any>(compositeKvsKey: CompositeKvsKey<T>): KvsKey<T> => {
  // Must be a keyof T
  if (typeof compositeKvsKey === 'string') {
    return kvsKey<T>(compositeKvsKey as KeyOf<T>, 'string');
  }

  // must be a KvsKey<T>
  return compositeKvsKey as KvsKey<T>;
};

const isCompositeKvsIndexACompositeCompositeKvsIndex = <T extends object = any>(
  compositeKvsIndex: CompositeKvsIndex<T>,
): compositeKvsIndex is CompositeCompositeKvsIndex<T> => {
  return typeof compositeKvsIndex !== 'string';
};

const convertCompositeKvsIndexToKvsIndex = <T extends object = any>(compositeKvsIndex: CompositeKvsIndex<T>): KvsIndex<T> => {
  if (!isCompositeKvsIndexACompositeCompositeKvsIndex<T>(compositeKvsIndex)) {
    return {
      name: compositeKvsIndex,
      partitionKey: kvsKey<T>(compositeKvsIndex, 'string'),
    };
  }

  const partitionKey = convertCompositeKvsKeyToKvsKey<T>(compositeKvsIndex.partitionKey);

  return {
    name: compositeKvsIndex.name ?? partitionKey.key,
    partitionKey,
    sortKey: compositeKvsIndex.sortKey ? convertCompositeKvsKeyToKvsKey<T>(compositeKvsIndex.sortKey) : undefined,
  };
};

export const defineKeyValueStore = <T extends object = any>(
  keyValueStoreName: string,

  partitionKey: CompositeKvsKey<T>,
  sortKeys: CompositeKvsKey<T>[] = [],

  options?: QPQConfigAdvancedKeyValueStoreSettings<T>,
): KeyValueStoreQPQConfigSetting<T> => {
  const tablePartitionKey = convertCompositeKvsKeyToKvsKey<T>(partitionKey);
  const indexes = (options?.indexes ?? []).map(convertCompositeKvsIndexToKvsIndex<T>);

  const duplicateIndexName = indexes.find((index, position) => indexes.findIndex((other) => other.name === index.name) !== position);
  if (duplicateIndexName) {
    throw new Error(`Key value store '${keyValueStoreName}' declares two indexes named '${duplicateIndexName.name}'; give one an explicit name`);
  }

  // A scoped store's indexes are partitioned per scope, which every backend can do
  // for a string or number key but not a binary one.
  if (options?.scoped && indexes.some((index) => index.partitionKey.type === 'binary' && index.partitionKey.key !== tablePartitionKey.key)) {
    throw new Error(`Key value store '${keyValueStoreName}' is scoped, so its index partition keys must be strings or numbers`);
  }

  return {
    configSettingType: QPQCoreConfigSettingType.keyValueStore,
    uniqueKey: keyValueStoreName,

    keyValueStoreName,

    partitionKey: tablePartitionKey,
    sortKeys: sortKeys.map(convertCompositeKvsKeyToKvsKey<T>),

    indexes,

    global: options?.global ?? false,

    owner: options?.owner,

    ttlAttribute: options?.ttlAttribute,

    disablePointInTimeRecovery: options?.disablePointInTimeRecovery ?? false,

    cryptoKeyName: options?.cryptoKeyName,
    scoped: options?.scoped ?? false,

    onStream: options?.onStream,
  };
};
