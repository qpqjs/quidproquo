import { runStory, StateActionType, StateDispatchAction } from 'quidproquo-core';
import { QueryParamsActionType, QueryParamsSetAction } from 'quidproquo-web';

import { describe, expect, it } from 'vitest';

import { SharedQueryParamsEffect } from '../sharedQueryParamsTypes';
import { askSetParam } from './askSetParam';

describe('askSetParam', () => {
  it('writes the query param then dispatches the UI SetParam effect', () => {
    const setPayloads: unknown[] = [];
    const dispatched: unknown[] = [];

    runStory(askSetParam('tab', ['one', 'two']), {
      [QueryParamsActionType.Set]: (action: QueryParamsSetAction) => {
        setPayloads.push(action.payload);
      },
      [StateActionType.Dispatch]: (action: StateDispatchAction<unknown>) => {
        dispatched.push(action.payload.action);
      },
    });

    expect(setPayloads).toEqual([{ key: 'tab', values: ['one', 'two'], createHistoryEntry: false }]);
    expect(dispatched).toEqual([{ type: SharedQueryParamsEffect.SetParam, payload: { key: 'tab', values: ['one', 'two'] } }]);
  });
});
