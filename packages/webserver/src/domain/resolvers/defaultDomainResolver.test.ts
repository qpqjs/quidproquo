import { describe, expect, it } from 'vitest';

import { defaultDomainResolver } from './defaultDomainResolver';

describe('defaultDomainResolver', () => {
  it('drops the environment label in production', () => {
    expect(defaultDomainResolver.resolveHost({ rootDomain: 'example.com', environment: 'production' })).toBe('example.com');
    expect(defaultDomainResolver.resolveHost({ rootDomain: 'example.com', environment: 'production', subdomain: 'api' })).toBe('api.example.com');
  });

  it('orders labels subdomain, service, feature, environment, root', () => {
    expect(
      defaultDomainResolver.resolveHost({ rootDomain: 'example.com', environment: 'development', feature: 'joe', service: 'ws', subdomain: 'ws' }),
    ).toBe('ws.ws.joe.development.example.com');
  });
});
