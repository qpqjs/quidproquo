import { buildTestQpqConfig } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getVirtualNetworkWorkloadSecurityGroupName } from './qpqAwsCdkNamingUtils';

describe('getVirtualNetworkWorkloadSecurityGroupName', () => {
  it('derives the bootstrap-scoped name (no service segment) from the virtual network name', () => {
    const config = buildTestQpqConfig([], { applicationName: 'my-app', environment: 'production' });

    expect(getVirtualNetworkWorkloadSecurityGroupName('main', config)).toBe('main-workload-my-app-production');
  });

  it('includes the feature segment when deployed to a feature sandbox', () => {
    const config = buildTestQpqConfig([], { applicationName: 'my-app', environment: 'development', feature: 'joe' });

    expect(getVirtualNetworkWorkloadSecurityGroupName('main', config)).toBe('main-workload-my-app-development-joe');
  });
});
