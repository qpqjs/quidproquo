import { buildTestQpqConfig, ConfigActionType, resolveActionResult } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getConfigGetApplicationInfoActionProcessor } from './getConfigGetApplicationInfoActionProcessor';

describe('getConfigGetApplicationInfoActionProcessor', () => {
  it('returns the application module info derived from the config', async () => {
    const qpqConfig = buildTestQpqConfig([], { applicationName: 'shop', moduleName: 'orders', environment: 'production', feature: 'beta' });
    const processor = (await getConfigGetApplicationInfoActionProcessor(qpqConfig, async () => null))[ConfigActionType.GetApplicationInfo] as (
      p: any,
      ...rest: any[]
    ) => Promise<any>;

    const result = await processor(undefined, undefined as any);

    expect(resolveActionResult(result)).toEqual({
      environment: 'production',
      feature: 'beta',
      module: 'orders',
      name: 'shop',
    });
  });
});
