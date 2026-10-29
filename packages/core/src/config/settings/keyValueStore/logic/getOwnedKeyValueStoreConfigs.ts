import { getOwnedItems } from '../../../../logic/config/getOwnedItems';
import { QPQConfig } from '../../../QPQConfig';
import { KeyValueStoreQPQConfigSetting } from '../types';
import { getAllKeyValueStoreConfigs } from './getAllKeyValueStoreConfigs';

export const getOwnedKeyValueStoreConfigs = <T extends object = any>(qpqConfig: QPQConfig): KeyValueStoreQPQConfigSetting<T>[] =>
  getOwnedItems(getAllKeyValueStoreConfigs<T>(qpqConfig), qpqConfig);
