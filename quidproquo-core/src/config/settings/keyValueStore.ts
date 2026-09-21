import { CrossModuleOwner, KeyOf, QpqFunctionRuntime } from '../../types';
import { QPQConfigAdvancedSettings, QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';

// TODO: When we put validation on the QPQConfig, we need to make sure
// Key Length and Data Type: DynamoDB has limitations on key length and data type.
// Your KvsKeyType only supports 'string', 'number', and 'binary' types. Make sure
// that you're validating these in convertKvsKeyToDynamodbAttribute function and
// also ensure that key length is within DynamoDB's specified limits.

export type KvsKeyType = 'string' | 'number' | 'binary';
export type KvsKey<T extends object = any> = {
  key: KeyOf<T>;
  type: KvsKeyType;
};

export type KvsIndex<T extends object = any> = {
  partitionKey: KvsKey<T>;
  sortKey?: KvsKey<T>;
};

export const kvsKey = <T extends object = any>(key: KeyOf<T>, type: KvsKeyType = 'string'): KvsKey<T> => ({
  key,
  type,
});

type CompositeKvsKey<T extends object = any> = KvsKey<T> | KeyOf<T>;

type CompositeCompositeKvsIndex<T extends object = any> = {
  partitionKey: CompositeKvsKey<T>;
  sortKey?: CompositeKvsKey<T>;
};

export type CompositeKvsIndex<T extends object = any> = KeyOf<T> | CompositeCompositeKvsIndex<T>;

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
      partitionKey: kvsKey<T>(compositeKvsIndex, 'string'),
    };
  }

  return {
    partitionKey: convertCompositeKvsKeyToKvsKey<T>(compositeKvsIndex.partitionKey),
    sortKey: compositeKvsIndex.sortKey ? convertCompositeKvsKeyToKvsKey<T>(compositeKvsIndex.sortKey) : undefined,
  };
};

/**
 * Change data capture on a store: the table gets a stream (NEW_AND_OLD_IMAGES) and
 * `runtime` is invoked with the changes.
 *
 * Records arrive in order PER PARTITION KEY, and different partition keys are processed
 * concurrently. A stream handler therefore gets one-writer-per-item serialisation for
 * free, which is what makes a stream the natural place to maintain a projection of a table
 * you only ever append to — no queue, no extra write on the append path, and no trigger to
 * lose, because the record exists precisely because the write happened.
 *
 * Mirrors defineStorageDrive's `onEvent`.
 */
export type KvsStreamSettings = {
  runtime: QpqFunctionRuntime;

  /**
   * Collapse each delivered batch down to ONE record per partition key, keeping the latest.
   *
   * Off by default: a generic consumer (audit trail, change notifications) needs to see
   * every change, and the framework should never silently drop records.
   *
   * On for a PROJECTION, where the payload that matters is "this key changed" and the
   * handler re-derives from source anyway. Without it, the batch is fanned back out into
   * one story run per record and the batching bought nothing: 500 appends to one document
   * would mean 500 re-derivations, each reading a log that grows as it goes. With it, that
   * batch is a single re-derivation.
   */
  coalesceByPartitionKey?: boolean;

  /** Records per invocation. DynamoDB streams allow up to 1000; the mapping default is 100. */
  batchSize?: number;

  /**
   * How long to wait accumulating records before invoking, 0 to 300 seconds. Trades
   * projection latency for far fewer invocations, and gives coalescing more to collapse.
   */
  maximumBatchingWindowInSeconds?: number;
};

export interface QPQConfigAdvancedKeyValueStoreSettings<T extends object = any> extends QPQConfigAdvancedSettings {
  indexes?: CompositeKvsIndex<T>[];

  global?: boolean;

  owner?: CrossModuleOwner;

  ttlAttribute?: string;

  // Point-in-time recovery (35-day continuous backups) is on by default; set this to opt out.
  disablePointInTimeRecovery?: boolean;

  // Encrypt the table with the named defineCryptoKey instead of the provider's own managed
  // encryption, which always applies. The key must be declared in the same config, owned or
  // foreign; a foreign key's owning service must be deployed first.
  cryptoKeyName?: string;

  // Every action on this store must carry a scope; an unscoped call is refused rather
  // than hitting the unpartitioned rows. askKeyValueStoreScanAllScopes is exempt.
  scoped?: boolean;

  // Turn on change data capture — see KvsStreamSettings. Absent means no stream is
  // created at all.
  onStream?: KvsStreamSettings;
}

export interface KeyValueStoreQPQConfigSetting<T extends object = any> extends QPQConfigSetting {
  keyValueStoreName: string;

  partitionKey: KvsKey<T>;
  sortKeys: KvsKey<T>[];

  indexes: KvsIndex<T>[];

  global: boolean;

  ttlAttribute?: string;

  disablePointInTimeRecovery: boolean;

  cryptoKeyName?: string;
  scoped: boolean;

  onStream?: KvsStreamSettings;
}

export const defineKeyValueStore = <T extends object = any>(
  keyValueStoreName: string,

  partitionKey: CompositeKvsKey<T>,
  sortKeys: CompositeKvsKey<T>[] = [],

  options?: QPQConfigAdvancedKeyValueStoreSettings<T>,
): KeyValueStoreQPQConfigSetting<T> => ({
  configSettingType: QPQCoreConfigSettingType.keyValueStore,
  uniqueKey: keyValueStoreName,

  keyValueStoreName,

  partitionKey: convertCompositeKvsKeyToKvsKey<T>(partitionKey),
  sortKeys: sortKeys.map(convertCompositeKvsKeyToKvsKey<T>),

  indexes: (options?.indexes ?? []).map(convertCompositeKvsIndexToKvsIndex<T>),

  global: options?.global ?? false,

  owner: options?.owner,

  ttlAttribute: options?.ttlAttribute,

  disablePointInTimeRecovery: options?.disablePointInTimeRecovery ?? false,

  cryptoKeyName: options?.cryptoKeyName,
  scoped: options?.scoped ?? false,

  onStream: options?.onStream,
});
