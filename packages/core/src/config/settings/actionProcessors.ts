import { QpqFunctionRuntime } from '../../types';
import { getUniqueKeyFromQpqFunctionRuntime } from '../../utils';
import { QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';

export interface ActionProcessorsQPQConfigSetting extends QPQConfigSetting {
  runtime: QpqFunctionRuntime;
}

export const defineActionProcessors = (getActionProcessors: QpqFunctionRuntime): ActionProcessorsQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.actionProcessors,
  uniqueKey: getUniqueKeyFromQpqFunctionRuntime(getActionProcessors),

  runtime: getActionProcessors,
});
