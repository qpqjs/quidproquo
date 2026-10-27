import { buildTestQpqConfig, noopDynamicModuleLoader } from '@qpqjs/core';

import { describe, expect, it, vi } from 'vitest';

import { getQpqLambdaRuntimeForEvent } from './helpers/getQpqLambdaRuntimeForEvent';
import { getAnyExecuteServiceFunctionEvent_serviceFunction } from './getAnyExecuteServiceFunctionEvent_serviceFunction';

vi.mock('./helpers/getQpqLambdaRuntimeForEvent', () => ({ getQpqLambdaRuntimeForEvent: vi.fn() }));

describe('getAnyExecuteServiceFunctionEvent_serviceFunction', () => {
  // Security regression: the invoke payload is authored by another lambda, so the session it carries is
  // filtered on the way in too; a planted token, local context or function globals never reach the story.
  it('filters the incoming story session to its cross-service form', () => {
    getAnyExecuteServiceFunctionEvent_serviceFunction(noopDynamicModuleLoader, buildTestQpqConfig());

    const getStorySession = vi.mocked(getQpqLambdaRuntimeForEvent).mock.calls[0][1];
    const session = getStorySession({
      functionName: 'doThing',
      payload: [],
      storySession: {
        depth: 1,
        context: { tenant: 't1' },
        accessToken: 'planted-bearer',
        localContext: { adminOverride: true },
        functionGlobals: { eventDocUserDirectory: 'admins' },
      },
    } as any);

    expect(session).toEqual({ depth: 1, context: { tenant: 't1' } });
  });
});
