import { buildTestQpqConfig } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getWebserverActionProcessor } from './index';

describe('getWebserverActionProcessor', () => {
  it('exposes the shared js webserver processors', async () => {
    const processors = await getWebserverActionProcessor(buildTestQpqConfig(), async () => null);

    expect(Object.keys(processors).length).toBeGreaterThan(0);
  });
});
