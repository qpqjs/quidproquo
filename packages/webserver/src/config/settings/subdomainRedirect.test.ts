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
    });
  });

  it('honours the supplied flags', () => {
    const setting = defineSubdomainRedirect('www', './build', 'https://example.com', false, false, false);

    expect(setting.addEnvironment).toBe(false);
    expect(setting.addFeatureEnvironment).toBe(false);
    expect(setting.onRootDomain).toBe(false);
  });

  // Security regression: the redirect target is config, stored verbatim, so what a request can add is only the path and
  // query the handler appends under it; nothing in the setting is derived from a request.
  it('keeps the target url exactly as written, path and query included', () => {
    const setting = defineSubdomainRedirect('go', './build', 'https://example.com/landing?utm=x');

    expect(setting.redirectUrl).toBe('https://example.com/landing?utm=x');
    expect(Object.keys(setting).sort()).toEqual(
      [
        'addEnvironment',
        'addFeatureEnvironment',
        'apiBuildPath',
        'configSettingType',
        'onRootDomain',
        'redirectUrl',
        'subdomain',
        'uniqueKey',
      ].sort(),
    );
  });
});
