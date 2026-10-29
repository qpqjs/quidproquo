import { getConfigSettings } from '../../../../logic/config/getConfigSettings';
import { QPQConfig, QPQCoreConfigSettingType } from '../../../QPQConfig';
import { UserDirectoryQPQConfigSetting } from '../types';

export const getAllUserDirectoryConfigs = (qpqConfig: QPQConfig): UserDirectoryQPQConfigSetting[] =>
  getConfigSettings<UserDirectoryQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.userDirectory);
