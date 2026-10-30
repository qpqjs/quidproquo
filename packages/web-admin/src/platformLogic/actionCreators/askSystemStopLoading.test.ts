import { StateActionType } from '@qpqjs/core';
import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { SystemEffect } from '../effects/SystemEffect';
import { askSystemStopLoading } from './askSystemStopLoading';

describe('askSystemStopLoading', () => {
  it('dispatches a StopLoading effect', () => {
    const { action } = captureRequester(askSystemStopLoading());

    expect(action).toEqual({
      type: StateActionType.Dispatch,
      payload: { action: { type: SystemEffect.StopLoading, payload: undefined } },
    });
  });
});
