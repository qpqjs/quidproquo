import { describe, expect, it } from 'vitest';

import { QPQWebServerConfigSettingType } from '../QPQConfig';
import { defineSubdomainRedirect } from './subdomainRedirect';

describe('defineSubdomainRedirect', () => {
  it('builds a SubdomainRedirect setting with environment flags defaulting on', () => {
    expect(defineSubdomainRedirect('www', './build', 'https://example.com')).toEqual({
      configSettingType: QPQWebServerConfigSettingType.SubdomainRedirect,
      uniqueKey: 'www',
      subdomain: 'www',
      redirectUrl: 'https://example.com',
      apiBuildPath: './build',
      addEnvironment: true,
      addFeatureEnvironment: true,
      onRootDomain: true,
      cloudflareApiKeySecretName: undefined,
    });
  });

  it('honours the supplied flags and cloudflare secret', () => {
    const setting = defineSubdomainRedirect('www', './build', 'https://example.com', false, false, false, {
      cloudflareApiKeySecretName: 'cf-secret',
    });

    expect(setting.addEnvironment).toBe(false);
    expect(setting.addFeatureEnvironment).toBe(false);
    expect(setting.onRootDomain).toBe(false);
    expect(setting.cloudflareApiKeySecretName).toBe('cf-secret');
  });
});
