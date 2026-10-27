import { captureRequester } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askQueryParamsGet } from './askQueryParamsGet';
import { QueryParamsActionType } from './QueryParamsActionType';

describe('askQueryParamsGet', () => {
  it('yields a Get action carrying the key', () => {
    const { action } = captureRequester(askQueryParamsGet('search'));

    expect(action).toEqual({ type: QueryParamsActionType.Get, payload: { key: 'search' } });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askQueryParamsGet('search'), 'shoes');

    expect(returned).toBe('shoes');
  });
});
