import { QPQConfig } from '../../../QPQConfig';
import { KeyValueStoreQPQConfigSetting } from '../types';
import { getKeyValueStoreByName } from './getKeyValueStoreByName';

export const resolveKeyValueStoreOrThrow = <T extends object = any>(name: string, qpqConfig: QPQConfig): KeyValueStoreQPQConfigSetting<T> => {
  const store = getKeyValueStoreByName<T>(name, qpqConfig);

  if (!store) {
    throw new Error(`No key value store config setting found for [${name}]`);
  }

  return store;
};
