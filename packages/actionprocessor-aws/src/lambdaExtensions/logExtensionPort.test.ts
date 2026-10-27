import { describe, expect, it } from 'vitest';

import { LOG_EXTENSION_PORT } from './logExtensionPort';

describe('LOG_EXTENSION_PORT', () => {
  it('is the fixed localhost port shared with the log extension', () => {
    expect(LOG_EXTENSION_PORT).toBe(9009);
  });
});
