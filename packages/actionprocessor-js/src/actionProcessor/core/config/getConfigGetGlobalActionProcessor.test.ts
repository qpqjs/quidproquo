import { buildTestQpqConfig, buildTestStorySession, ConfigActionType, defineGlobal, resolveActionResult } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getConfigGetGlobalActionProcessor } from './getConfigGetGlobalActionProcessor';

describe('getConfigGetGlobalActionProcessor', () => {
  const resolve = async (settings = [defineGlobal('region', 'us-east-1')]) =>
    (await getConfigGetGlobalActionProcessor(buildTestQpqConfig(settings), async () => null))[ConfigActionType.GetGlobal] as (
      p: any,
      ...rest: any[]
    ) => Promise<any>;

  it('returns the config global value when no function global overrides it', async () => {
    const processor = await resolve();

    const result = await processor({ globalName: 'region' }, buildTestStorySession());

    expect(resolveActionResult(result)).toBe('us-east-1');
  });

  it('prefers a function global over the config global', async () => {
    const processor = await resolve();

    const result = await processor({ globalName: 'region' }, buildTestStorySession({ functionGlobals: { region: 'eu-west-1' } }));

    expect(resolveActionResult(result)).toBe('eu-west-1');
  });

  it('throws when the global is declared nowhere', async () => {
    const processor = await resolve([]);

    await expect(processor({ globalName: 'missing' }, buildTestStorySession())).rejects.toThrow('Global config missing not found');
  });
});
