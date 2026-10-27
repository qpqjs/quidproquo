import { captureRequester } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askQueryParamsSet } from './askQueryParamsSet';
import { QueryParamsActionType } from './QueryParamsActionType';

describe('askQueryParamsSet', () => {
  it('defaults createHistoryEntry to false when omitted', () => {
    const { action } = captureRequester(askQueryParamsSet('search', ['shoes']));

    expect(action).toEqual({
      type: QueryParamsActionType.Set,
      payload: { key: 'search', values: ['shoes'], createHistoryEntry: false },
    });
  });

  it('forwards an explicit createHistoryEntry', () => {
    const { action } = captureRequester(askQueryParamsSet('search', ['shoes', 'boots'], true));

    expect(action).toEqual({
      type: QueryParamsActionType.Set,
      payload: { key: 'search', values: ['shoes', 'boots'], createHistoryEntry: true },
    });
  });
});
