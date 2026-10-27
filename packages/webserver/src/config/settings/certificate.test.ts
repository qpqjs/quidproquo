import { describe, expect, it } from 'vitest';

import { QPQWebServerConfigSettingType } from '../QPQConfig';
import { defineCertificate } from './certificate';

describe('defineCertificate', () => {
  it('builds a Certificate setting keyed by onRootDomain and subdomain', () => {
    expect(defineCertificate(true, 'example.com', 'app')).toEqual({
      configSettingType: QPQWebServerConfigSettingType.Certificate,
      uniqueKey: 'trueapp',
      onRootDomain: true,
      subdomain: 'app',
      rootDomain: 'example.com',
    });
  });

  it('leaves the subdomain undefined when omitted', () => {
    const setting = defineCertificate(false, 'example.com');

    expect(setting.subdomain).toBeUndefined();
    expect(setting.uniqueKey).toBe('falseundefined');
  });
});
