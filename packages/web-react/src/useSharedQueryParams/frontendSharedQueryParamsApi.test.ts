import { describe, expect, it } from 'vitest';

import { askSetParam } from './logic/askSetParam';
import { frontendSharedQueryParamsApi } from './frontendSharedQueryParamsApi';

describe('frontendSharedQueryParamsApi', () => {
  it('exposes askSetParam', () => {
    expect(frontendSharedQueryParamsApi.askSetParam).toBe(askSetParam);
  });
});
