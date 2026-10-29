import { StateActionType } from '@qpqjs/core';
import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { SharedQueryParamsEffect } from '../effects/SharedQueryParamsEffect';
import { askSharedQueryParamsUISetParam } from './askSharedQueryParamsUISetParam';

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
