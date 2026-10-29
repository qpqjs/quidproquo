import { describe, expect, it } from 'vitest';

import { assertLambdaMemoryInMiB, assertLambdaTimeoutInSeconds, clampToLambdaTimeout } from './awsLimits';

describe('awsLimits', () => {
  it('clamps a timeout to the lambda ceiling and leaves a shorter one alone', () => {
    expect(clampToLambdaTimeout(99999)).toBe(900);
    expect(clampToLambdaTimeout(30)).toBe(30);
  });

  // Security regression: the sandbox's time and memory ceilings are config, so a typo must fail at synth rather than
  // deploy an unbounded runner.
  it.each([0, 901, 1.5, Number.NaN])('refuses a timeout of %s seconds', (timeoutInSeconds) => {
    expect(() => assertLambdaTimeoutInSeconds(timeoutInSeconds, 'runner')).toThrow('runner: timeoutInSeconds');
  });

  it.each([127, 10241, 512.5])('refuses a memory of %s MiB', (memoryInMiB) => {
    expect(() => assertLambdaMemoryInMiB(memoryInMiB, 'runner')).toThrow('runner: memoryInMiB');
  });

  it('accepts values inside the lambda range', () => {
    expect(() => assertLambdaTimeoutInSeconds(900, 'runner')).not.toThrow();
    expect(() => assertLambdaMemoryInMiB(128, 'runner')).not.toThrow();
  });
});
