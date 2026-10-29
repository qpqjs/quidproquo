import { getConfigSettings } from '../../../../logic/config/getConfigSettings';
import { QPQConfig, QPQCoreConfigSettingType } from '../../../QPQConfig';
import { ParameterQPQConfigSetting } from '../types';

export const getAllParameterConfigs = (qpqConfig: QPQConfig): ParameterQPQConfigSetting[] =>
  getConfigSettings<ParameterQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.parameter);
