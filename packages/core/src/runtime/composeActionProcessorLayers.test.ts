import { buildTestQpqConfig, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { ActionProcessorListResolver } from '../types/Action';
import { composeActionProcessorLayers } from './composeActionProcessorLayers';

const layer =
  (list: Record<string, string>): ActionProcessorListResolver =>
  async () =>
    Object.fromEntries(Object.entries(list).map(([type, tag]) => [type, async () => [tag]]));

describe('composeActionProcessorLayers', () => {
  it('merges the layers in order so a later layer overrides an earlier one', async () => {
    const processors = await composeActionProcessorLayers(buildTestQpqConfig(), noopDynamicModuleLoader, [
      layer({ a: 'platform', b: 'platform' }),
      layer({ b: 'host' }),
      layer({ c: 'custom', a: 'custom' }),
    ]);

    expect(Object.keys(processors).sort()).toEqual(['a', 'b', 'c']);
    expect(await processors.a!({}, {} as never, {}, {} as never, () => {}, noopDynamicModuleLoader, {} as never)).toEqual(['custom']);
    expect(await processors.b!({}, {} as never, {}, {} as never, () => {}, noopDynamicModuleLoader, {} as never)).toEqual(['host']);
  });

  it('answers an empty list for no layers', async () => {
    expect(await composeActionProcessorLayers(buildTestQpqConfig(), noopDynamicModuleLoader, [])).toEqual({});
  });
});
