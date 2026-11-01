import { describe, expect, it } from 'vitest';

import { clampToLambdaTimeout } from './clampToLambdaTimeout';

describe('clampToLambdaTimeout', () => {
  it('clamps a timeout to the lambda ceiling and leaves a shorter one alone', () => {
    expect(clampToLambdaTimeout(99999)).toBe(900);
    expect(clampToLambdaTimeout(30)).toBe(30);
  });
});
