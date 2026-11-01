import { describe, expect, it } from 'vitest';

import { assertLambdaMemoryInMiB } from './assertLambdaMemoryInMiB';

describe('assertLambdaMemoryInMiB', () => {
  // Security regression: the sandbox's memory ceiling is config, so a typo must fail at synth rather than deploy an
  // unbounded runner.
  it.each([127, 10241, 512.5])('refuses a memory of %s MiB', (memoryInMiB: any) => {
    expect(() => assertLambdaMemoryInMiB(memoryInMiB, 'runner')).toThrow('runner: memoryInMiB');
  });

  it('accepts a memory size inside the lambda range', () => {
    expect(() => assertLambdaMemoryInMiB(128, 'runner')).not.toThrow();
  });
});
