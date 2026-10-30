import { ActionOf, askStateDispatchBase, StateActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';
import { QueryParamsActionType } from '@qpqjs/web';

import { describe, expect, it } from 'vitest';

import { SharedQueryParamsEffect } from '../effects/SharedQueryParamsEffect';
import { askSyncParams } from './askSyncParams';

describe('askSyncParams', () => {
  it('dispatches a UI SetParam effect for every query param', () => {
    const dispatched: unknown[] = [];

    runStory(askSyncParams(), {
      [QueryParamsActionType.GetAll]: { tab: ['one'], page: ['2'] },
      [StateActionType.Dispatch]: (action: ActionOf<typeof askStateDispatchBase>) => {
        dispatched.push(action.payload.action);
      },
    });

    expect(dispatched).toEqual([
      { type: SharedQueryParamsEffect.SetParam, payload: { key: 'tab', values: ['one'] } },
      { type: SharedQueryParamsEffect.SetParam, payload: { key: 'page', values: ['2'] } },
    ]);
  });

  it('dispatches nothing when there are no query params', () => {
    const dispatched: unknown[] = [];

    runStory(askSyncParams(), {
      [QueryParamsActionType.GetAll]: {},
      [StateActionType.Dispatch]: (action: ActionOf<typeof askStateDispatchBase>) => {
        dispatched.push(action.payload.action);
      },
    });

    expect(dispatched).toEqual([]);
  });
});
