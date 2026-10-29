import { QpqFunctionRuntime } from '../../types';
import { QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';

export type DeployEventsQPQConfigSetting = {
  name: string;
  runtime: QpqFunctionRuntime;
} & QPQConfigSetting;

export const defineDeployEvent = (name: string, runtime: QpqFunctionRuntime): DeployEventsQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.deployEvent,
  uniqueKey: name,

  runtime,
  name,
});
