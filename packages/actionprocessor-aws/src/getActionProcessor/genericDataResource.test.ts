import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { buildTestQpqConfig, noopDynamicModuleLoader } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { getAwsActionProcessors } from './index';

// Security regression: the generic data resource requesters (an unscoped table put and scan) have no processor on the
// deployed runtime, so a story that yields one fails as an unknown action instead of reaching a table.
describe('getAwsActionProcessors', () => {
  it('registers no processor for the generic data resource actions', async () => {
    const processors = await getAwsActionProcessors(buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1')]), noopDynamicModuleLoader);

    const genericDataResourceActions = Object.keys(processors).filter((actionType) => actionType.includes('GenericDataResource'));
    expect(genericDataResourceActions).toEqual([]);
    expect(Object.keys(processors).length).toBeGreaterThan(50);
  });

  // Security regression: the webserver admin log actions have no processor either, so the only admin log surface is
  // the features admin module behind the admin user pool.
  it('registers no processor for the webserver admin log actions', async () => {
    const processors = await getAwsActionProcessors(buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1')]), noopDynamicModuleLoader);

    expect(Object.keys(processors).filter((actionType) => actionType.includes('@quidproquo-webserver/Admin/'))).toEqual([]);
  });
});
