import { KeyValueStoreQPQConfigSetting, Nullable } from 'quidproquo-core';

export type KvsCompositeKeyParts = {
  pk: string;
  sk: Nullable<string>;
};

/**
 * Split a 'pk#sk' key string (the dev-server convention, see
 * toKvsCompositeKey) at the first '#'. A pk that itself contains '#'
 * mis-splits here; callers cover that with a concat-equality fallback on the
 * miss path.
 */
export const splitKvsCompositeKey = (key: string, storeConfig: KeyValueStoreQPQConfigSetting): KvsCompositeKeyParts => {
  if (storeConfig.sortKeys.length === 0) {
    return { pk: key, sk: null };
  }

  const separatorIndex = key.indexOf('#');
  if (separatorIndex === -1) {
    return { pk: key, sk: null };
  }

  return { pk: key.slice(0, separatorIndex), sk: key.slice(separatorIndex + 1) };
};
