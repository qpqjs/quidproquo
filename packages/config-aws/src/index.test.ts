import { describe, expect, it } from 'vitest';

import * as packageRoot from './index';

describe('@qpqjs/config-aws', () => {
  it('exposes the naming module from the package root', () => {
    expect(packageRoot.awsNamingUtils.getQpqRuntimeResourceNameFromConfig).toBeTypeOf('function');
    expect(packageRoot.getScopedKvsIndexAttributeName('customerId')).toContain('GSI_customerId');
  });
});
