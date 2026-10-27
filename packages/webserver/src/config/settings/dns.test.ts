import { describe, expect, it } from 'vitest';

import { QPQWebServerConfigSettingType } from '../QPQConfig';
import { defineDns } from './dns';

describe('defineDns', () => {
  it('wraps a single root in a list', () => {
    expect(defineDns('example.com')).toEqual({
      configSettingType: QPQWebServerConfigSettingType.Dns,
      uniqueKey: 'example.com',
      rootDomains: ['example.com'],
      resolver: undefined,
    });
  });

  it('keeps root order, primary first, and carries the resolver pointer', () => {
    const resolver = { basePath: '/app/packages/domain', relativePath: 'resolver', functionName: 'domainResolver' };
    const setting = defineDns(['example.com', 'example.org'], { resolver });

    expect(setting.uniqueKey).toBe('example.com|example.org');
    expect(setting.rootDomains).toEqual(['example.com', 'example.org']);
    expect(setting.resolver).toEqual(resolver);
  });
});
