import { getOwnedItems } from '../../../../logic/config/getOwnedItems';
import { QPQConfig } from '../../../QPQConfig';
import { StorageDriveQPQConfigSetting } from '../types';
import { getAllStorageDriveConfigs } from './getAllStorageDriveConfigs';

export const getOwnedStorageDriveConfigs = (qpqConfig: QPQConfig): StorageDriveQPQConfigSetting[] =>
  getOwnedItems(getAllStorageDriveConfigs(qpqConfig), qpqConfig);
