import { getConfigSettings } from '../../../../logic/config/getConfigSettings';
import { QPQConfig, QPQCoreConfigSettingType } from '../../../QPQConfig';
import { StorageDriveQPQConfigSetting } from '../types';

export const getAllStorageDriveConfigs = (qpqConfig: QPQConfig): StorageDriveQPQConfigSetting[] =>
  getConfigSettings<StorageDriveQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.storageDrive);
