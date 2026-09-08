import { describe, expect, it } from 'vitest';

import { localhostDomainResolver } from './localhostDomainResolver';

describe('localhostDomainResolver', () => {
  it('returns the root for every scope', () => {
    expect(
      localhostDomainResolver.resolveHost({ rootDomain: 'localhost:3080', environment: 'development', subdomain: 'api', service: 'shell' }),
    ).toBe('localhost:3080');
  });
});
