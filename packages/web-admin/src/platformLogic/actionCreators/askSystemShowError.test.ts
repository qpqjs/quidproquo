import { ActionOf, askStateDispatchBase, DateActionType, GuidActionType, StateActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { SystemEffect } from '../effects/SystemEffect';
import { askSystemShowError } from './askSystemShowError';

describe('askSystemShowError', () => {
  it('dispatches a ShowError effect carrying the message, time and id', () => {
    let dispatched: unknown;

    runStory(askSystemShowError('boom'), {
      [DateActionType.Now]: '2026-06-26T00:00:00.000Z',
      [GuidActionType.New]: 'guid-1',
      [StateActionType.Dispatch]: (action: ActionOf<typeof askStateDispatchBase>) => {
        dispatched = action.payload.action;
      },
    });

    expect(dispatched).toEqual({
      type: SystemEffect.ShowError,
      payload: { msg: 'boom', at: '2026-06-26T00:00:00.000Z', id: 'guid-1' },
    });
  });
});
