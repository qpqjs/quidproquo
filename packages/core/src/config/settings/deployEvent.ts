import { QpqFunctionRuntime } from '../../types';
import { QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';

export interface DeployEventsQPQConfigSetting extends QPQConfigSetting {
  name: string;
  runtime: QpqFunctionRuntime;
}

export const defineDeployEvent = (name: string, runtime: QpqFunctionRuntime): DeployEventsQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.deployEvent,
  uniqueKey: name,

  runtime,
  name,
});
