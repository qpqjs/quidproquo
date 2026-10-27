import { describe, expect, it } from 'vitest';

import { loadRspackModule } from './loadRspackModule';

describe('loadRspackModule', () => {
  it('imports the ESM-only rspack package and caches it', async () => {
    const first = await loadRspackModule();

    expect(first.rspack).toBeTypeOf('function');
    expect(await loadRspackModule()).toBe(first);
  });
});
