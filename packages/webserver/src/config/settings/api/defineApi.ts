import { QPQWebServerConfigSettingType } from '../../QPQConfig';
import { ApiQPQWebServerConfigSetting, QPQConfigAdvancedApiSettings } from './types';

export const defineApi = (apiName: string, options?: QPQConfigAdvancedApiSettings): ApiQPQWebServerConfigSetting => {
  return {
    configSettingType: QPQWebServerConfigSettingType.Api,
    uniqueKey: apiName,

    apiSubdomain: options?.subDomain ?? apiName,

    apiName: apiName,

    deprecated: options?.deprecated ?? false,

    virtualNetworkName: options?.virtualNetworkName,

    maxConcurrentExecutions: options?.maxConcurrentExecutions,
  };
};
