import { describe, expect, it } from 'vitest';

import { expectGenerator } from './vitest';

describe('quidproquo-testing/vitest entry point', () => {
  it('registers custom matchers and re-exports the barrel', () => {
    expect(expectGenerator).toBeTypeOf('function');

    function* gen(): Generator<any, void, any> {
      yield { type: 'ACTION' };
    }

    expect(gen()).toYieldValue({ type: 'ACTION' });
  });
});
