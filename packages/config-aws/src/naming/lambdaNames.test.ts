import { describe, expect, it } from 'vitest';

import { getLambdaBaseName, getServiceFunctionLambdaBaseName, QpqLambdaKind } from './lambdaNames';
import { withFeatureSuffix } from './withFeatureSuffix';

describe('lambda names', () => {
  it('suffixes the kind', () => {
    expect(getLambdaBaseName('orders', QpqLambdaKind.Queue)).toBe('orders-queue');
    expect(getServiceFunctionLambdaBaseName('trace')).toBe('trace-sfunc');
  });
});

describe('withFeatureSuffix', () => {
  it('adds the feature only when there is one, with the given separator', () => {
    expect(withFeatureSuffix('app-dev', undefined)).toBe('app-dev');
    expect(withFeatureSuffix('app-dev', 'beta')).toBe('app-dev-beta');
    expect(withFeatureSuffix('qpq/app/dev', 'beta', '/')).toBe('qpq/app/dev/beta');
  });
});
