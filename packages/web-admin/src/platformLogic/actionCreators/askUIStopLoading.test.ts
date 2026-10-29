import { StateActionType } from '@qpqjs/core';
import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { SystemEffect } from '../effects/SystemEffect';
import { askUIStopLoading } from './askUIStopLoading';

describe('askUIStopLoading', () => {
  it('dispatches a StopLoading effect', () => {
    const { action } = captureRequester(askUIStopLoading());

    expect(action).toEqual({
      type: StateActionType.Dispatch,
      payload: { action: { type: SystemEffect.StopLoading, payload: undefined } },
    });
  });
});
