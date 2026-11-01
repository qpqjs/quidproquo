import { describe, expect, it } from 'vitest';

import { getServiceFunctionLambdaBaseName } from './getServiceFunctionLambdaBaseName';

describe('getServiceFunctionLambdaBaseName', () => {
  it('suffixes the service function kind', () => {
    expect(getServiceFunctionLambdaBaseName('trace')).toBe('trace-sfunc');
  });
});
