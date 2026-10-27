import { buildTestQpqConfig, ConfigActionType, defineGlobal, defineParameter, defineSecret, resolveActionResult } from '@qpqjs/core';

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

  // Security regression: the answer is exactly the four values every browser bundle already carries; nothing else from
  // the config (secrets, globals, parameters) rides along.
  it('returns exactly the four public fields and nothing else from the config', async () => {
    const qpqConfig = buildTestQpqConfig([defineSecret('db-password'), defineGlobal('adminEmail', 'ops@example.com'), defineParameter('flag')], {
      applicationName: 'shop',
      moduleName: 'orders',
    });
    const processor = (await getConfigGetApplicationInfoActionProcessor(qpqConfig, async () => null))[ConfigActionType.GetApplicationInfo] as (
      p: any,
      ...rest: any[]
    ) => Promise<any>;

    const result = resolveActionResult(await processor(undefined, undefined as any));

    expect(Object.keys(result).sort()).toEqual(['environment', 'feature', 'module', 'name']);
    expect(JSON.stringify(result)).not.toContain('db-password');
    expect(JSON.stringify(result)).not.toContain('ops@example.com');
  });
});
