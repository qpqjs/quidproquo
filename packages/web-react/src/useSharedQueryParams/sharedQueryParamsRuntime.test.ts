import { describe, expect, it } from 'vitest';

import { sharedQueryParamsLogic } from './logic/runtime';
import { sharedQueryParamsInitalState } from './logic';
import { sharedQueryParamsRuntime } from './sharedQueryParamsRuntime';

describe('sharedQueryParamsRuntime', () => {
  it('builds a runtime definition seeded with the shared query params logic and state', () => {
    expect(sharedQueryParamsRuntime.uniqueName).toBe('qpq/web-react/sharedQueryParams');
    expect(sharedQueryParamsRuntime.api).toBe(sharedQueryParamsLogic);
    expect(sharedQueryParamsRuntime.initialState).toBe(sharedQueryParamsInitalState);
  });
});
