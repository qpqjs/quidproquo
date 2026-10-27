import { captureRequester } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askQueryParamsGetAll } from './askQueryParamsGetAll';
import { QueryParamsActionType } from './QueryParamsActionType';

describe('askQueryParamsGetAll', () => {
  it('yields a GetAll action', () => {
    const { action } = captureRequester(askQueryParamsGetAll());

    expect(action).toEqual({ type: QueryParamsActionType.GetAll });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askQueryParamsGetAll(), { search: ['shoes'] });

    expect(returned).toEqual({ search: ['shoes'] });
  });
});
