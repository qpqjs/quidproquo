import { describe, expect, it } from 'vitest';

import { assertLambdaTimeoutInSeconds } from './assertLambdaTimeoutInSeconds';

describe('assertLambdaTimeoutInSeconds', () => {
  // Security regression: the sandbox's time ceiling is config, so a typo must fail at synth rather than deploy an
  // unbounded runner.
  it.each([0, 901, 1.5, Number.NaN])('refuses a timeout of %s seconds', (timeoutInSeconds: any) => {
    expect(() => assertLambdaTimeoutInSeconds(timeoutInSeconds, 'runner')).toThrow('runner: timeoutInSeconds');
  });

  it('accepts a timeout inside the lambda range', () => {
    expect(() => assertLambdaTimeoutInSeconds(900, 'runner')).not.toThrow();
  });
});
