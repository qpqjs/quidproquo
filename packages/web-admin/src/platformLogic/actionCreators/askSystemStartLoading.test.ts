import { StateActionType } from '@qpqjs/core';
import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { SystemEffect } from '../effects/SystemEffect';
import { askSystemStartLoading } from './askSystemStartLoading';

describe('askSystemStartLoading', () => {
  it('dispatches a StartLoading effect', () => {
    const { action } = captureRequester(askSystemStartLoading());

    expect(action).toEqual({
      type: StateActionType.Dispatch,
      payload: { action: { type: SystemEffect.StartLoading, payload: undefined } },
    });
  });
});
