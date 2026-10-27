import {
  buildActionProcessorList,
  buildTestQpqConfig,
  buildTestStorySession,
  createStreamRegistry,
  createStubLogger,
  noopDynamicModuleLoader,
} from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { RouteAuthValidationActionType } from '../../actions/routeAuthValidation';
import { HTTPEvent } from '../../types/HTTPEvent';
import { getRouteAuthValidationResolveContextActionProcessor } from './getRouteAuthValidationResolveContextActionProcessor';

describe('getRouteAuthValidationResolveContextActionProcessor', () => {
  it('adds no context by default', async () => {
    const processors = await getRouteAuthValidationResolveContextActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
    const processor = processors[RouteAuthValidationActionType.ResolveContext];

    const [result, error] = await processor(
      { event: { headers: {} } as unknown as HTTPEvent, routeAuthSettings: {}, decodedAccessToken: null },
      buildTestStorySession(),
      buildActionProcessorList({}),
      createStubLogger(),
      () => {},
      noopDynamicModuleLoader,
      createStreamRegistry(),
    );

    expect(error).toBeUndefined();
    expect(result).toEqual({});
  });
});
