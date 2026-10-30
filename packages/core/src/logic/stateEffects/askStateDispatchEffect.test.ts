import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { StateActionType } from '../../actions/state';
import { askStateDispatchBase } from '../../actions/state/askStateDispatch';
import { ActionOf } from '../../types';
import { askStateDispatchEffect } from './askStateDispatchEffect';
import { Effect } from './Effect';

type AddEffect = Effect<'counter/Add', number>;
type IncrementEffect = Effect<'counter/Increment'>;

describe('askStateDispatchEffect', () => {
  it('dispatches the effect with its payload', () => {
    let dispatched: unknown;

    runStory(askStateDispatchEffect<AddEffect>('counter/Add', 5), {
      [StateActionType.Dispatch]: (action: ActionOf<typeof askStateDispatchBase>) => {
        dispatched = action.payload.action;
      },
    });

    expect(dispatched).toEqual({ type: 'counter/Add', payload: 5 });
  });

  it('defaults the payload to undefined', () => {
    let dispatched: unknown;

    runStory(askStateDispatchEffect<IncrementEffect>('counter/Increment'), {
      [StateActionType.Dispatch]: (action: ActionOf<typeof askStateDispatchBase>) => {
        dispatched = action.payload.action;
      },
    });

    expect(dispatched).toEqual({ type: 'counter/Increment', payload: undefined });
  });
});
