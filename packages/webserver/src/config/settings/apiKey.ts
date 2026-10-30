import { QPQConfigAdvancedSettings, QPQConfigSetting } from '@qpqjs/core';

import { QPQWebServerConfigSettingType } from '../QPQConfig';

export type ApiKey = {
  name: string;
  value?: string;
  description?: string;
};

export type ApiKeyReference = {
  name: string;

  applicationName?: string;
  serviceName?: string;
};

export type QPQConfigAdvancedApiKeySettings = {
  value?: string;
  description?: string;
} & QPQConfigAdvancedSettings;

export type ApiKeyQPQWebServerConfigSetting = {
  apiKey: ApiKey;
} & QPQConfigSetting;

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
