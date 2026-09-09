import { describe, expect, it } from 'vitest';

import { QPQWebServerConfigSettingType } from '../QPQConfig';
import { defineApi } from './api';

describe('defineApi', () => {
  it('builds an Api setting defaulting the subdomain to the api name and deprecated to false', () => {
    expect(defineApi('orders')).toEqual({
      configSettingType: QPQWebServerConfigSettingType.Api,
      uniqueKey: 'orders',
      apiSubdomain: 'orders',
      apiName: 'orders',
      deprecated: false,
      cloudflareApiKeySecretName: undefined,
      virtualNetworkName: undefined,
    });
  });

  it('honours the advanced options', () => {
    const setting = defineApi('orders', {
      subDomain: 'api-orders',
      deprecated: true,
      cloudflareApiKeySecretName: 'cf-secret',
      virtualNetworkName: 'vnet',
    });

    expect(setting.apiSubdomain).toBe('api-orders');
    expect(setting.deprecated).toBe(true);
    expect(setting.cloudflareApiKeySecretName).toBe('cf-secret');
    expect(setting.virtualNetworkName).toBe('vnet');
  });
});
