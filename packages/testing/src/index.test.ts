import { describe, expect, it } from 'vitest';

import { expectGenerator, GeneratorExpectChain } from './index';

describe('@qpqjs/testing barrel', () => {
  it('re-exports the generator expectation helpers', () => {
    expect(expectGenerator).toBeTypeOf('function');
    expect(GeneratorExpectChain).toBeTypeOf('function');
  });
});
