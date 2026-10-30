import { Nullable } from '../../../../types/Nullable';
import { QPQConfig } from '../../../QPQConfig';
import { KeyValueStoreQPQConfigSetting } from '../types';
import { getAllKeyValueStoreConfigs } from './getAllKeyValueStoreConfigs';

export const getKeyValueStoreByName = <T extends object = any>(name: string, qpqConfig: QPQConfig): Nullable<KeyValueStoreQPQConfigSetting<T>> =>
  getAllKeyValueStoreConfigs<T>(qpqConfig).find((store) => store.keyValueStoreName === name) ?? null;
