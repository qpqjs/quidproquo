import { QpqFunctionRuntime } from '../../types';
import { getUniqueKeyFromQpqFunctionRuntime } from '../../utils';
import { QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';

export type ActionProcessorsQPQConfigSetting = {
  runtime: QpqFunctionRuntime;
} & QPQConfigSetting;

export const defineActionProcessors = (getActionProcessors: QpqFunctionRuntime): ActionProcessorsQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.actionProcessors,
  uniqueKey: getUniqueKeyFromQpqFunctionRuntime(getActionProcessors),

  runtime: getActionProcessors,
});
