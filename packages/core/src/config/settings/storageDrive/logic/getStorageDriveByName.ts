import { Nullable } from '../../../../types/Nullable';
import { QPQConfig } from '../../../QPQConfig';
import { StorageDriveQPQConfigSetting } from '../types';
import { getAllStorageDriveConfigs } from './getAllStorageDriveConfigs';

export const getStorageDriveByName = (name: string, qpqConfig: QPQConfig): Nullable<StorageDriveQPQConfigSetting> =>
  getAllStorageDriveConfigs(qpqConfig).find((drive) => drive.storageDrive === name) ?? null;
