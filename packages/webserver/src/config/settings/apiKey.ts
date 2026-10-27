import { QPQConfigAdvancedSettings, QPQConfigSetting } from 'quidproquo-core';

import { QPQWebServerConfigSettingType } from '../QPQConfig';

export interface ApiKey {
  name: string;
  value?: string;
  description?: string;
}

export interface ApiKeyReference {
  name: string;

  applicationName?: string;
  serviceName?: string;
}

export interface QPQConfigAdvancedApiKeySettings extends QPQConfigAdvancedSettings {
  value?: string;
  description?: string;
}

export interface ApiKeyQPQWebServerConfigSetting extends QPQConfigSetting {
  apiKey: ApiKey;
}

export const defineApiKey = (apiKeyName: string, options?: QPQConfigAdvancedApiKeySettings): ApiKeyQPQWebServerConfigSetting => {
  return {
    configSettingType: QPQWebServerConfigSettingType.ApiKey,
    uniqueKey: apiKeyName,

    apiKey: {
      name: apiKeyName,
      value: options?.value,
      description: options?.description,
    },
  };
};
