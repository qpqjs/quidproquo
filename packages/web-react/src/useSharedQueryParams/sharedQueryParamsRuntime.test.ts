import { describe, expect, it } from 'vitest';

import { createInitialSharedQueryParamsState } from './logic/createInitialSharedQueryParamsState';
import { frontendSharedQueryParamsApi } from './frontendSharedQueryParamsApi';
import { sharedQueryParamsRuntime } from './sharedQueryParamsRuntime';

describe('sharedQueryParamsRuntime', () => {
  it('builds a runtime definition seeded with the shared query params logic and state', () => {
    expect(sharedQueryParamsRuntime.uniqueName).toBe('qpq/web-react/sharedQueryParams');
    expect(sharedQueryParamsRuntime.api).toBe(frontendSharedQueryParamsApi);
    expect(sharedQueryParamsRuntime.initialState).toEqual(createInitialSharedQueryParamsState());
  });
});
