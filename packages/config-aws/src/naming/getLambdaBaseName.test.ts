import { describe, expect, it } from 'vitest';

import { getLambdaBaseName } from './getLambdaBaseName';
import { QpqLambdaKind } from './QpqLambdaKind';

describe('getLambdaBaseName', () => {
  it('suffixes the kind', () => {
    expect(getLambdaBaseName('orders', QpqLambdaKind.Queue)).toBe('orders-queue');
  });
});
