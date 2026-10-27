import { StateActionType } from 'quidproquo-core';
import { captureRequester } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askSharedQueryParamsUISetParam } from './sharedQueryParamsActionCreator';
import { SharedQueryParamsEffect } from './sharedQueryParamsTypes';

describe('askSharedQueryParamsUISetParam', () => {
  it('yields a state dispatch carrying the SetParam effect', () => {
    const { action } = captureRequester(askSharedQueryParamsUISetParam('tab', ['one']));

    expect(action).toEqual({
      type: StateActionType.Dispatch,
      payload: {
        action: {
          type: SharedQueryParamsEffect.SetParam,
          payload: { key: 'tab', values: ['one'] },
        },
      },
    });
  });
});
