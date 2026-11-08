import { describe, expect, it } from 'vitest';

import { readSharedPrettierOptions } from './readSharedPrettierOptions';

describe('readSharedPrettierOptions', () => {
  it('returns the prettier options @qpqjs/eslint-config ships', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const shipped = (require('@qpqjs/eslint-config/prettier') as { default: unknown }).default;

    const options = readSharedPrettierOptions();

    expect(options).toEqual(shipped);
    expect(options.singleQuote).toBe(true);
    expect(options.printWidth).toBe(150);
  });
});
