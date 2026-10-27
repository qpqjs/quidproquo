import { describe, expect, it } from 'vitest';

import { askSetParam } from './askSetParam';
import { sharedQueryParamsLogic } from './sharedQueryParamsLogic';

describe('sharedQueryParamsLogic', () => {
  it('exposes askSetParam', () => {
    expect(sharedQueryParamsLogic.askSetParam).toBe(askSetParam);
  });
});
