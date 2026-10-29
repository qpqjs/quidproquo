import { QPQConfigSetting } from '../../../QPQConfig';
import { KvsIndex } from './KvsIndex';
import { KvsKey } from './KvsKey';
import { KvsStreamSettings } from './KvsStreamSettings';

export type KeyValueStoreQPQConfigSetting<T extends object = any> = {
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
} & QPQConfigSetting;
