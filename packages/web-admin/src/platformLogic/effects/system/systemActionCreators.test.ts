import { captureRequester, DateActionType, GuidActionType, runStory, StateActionType, StateDispatchAction } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askUIShowError, askUIStartLoading, askUIStopLoading } from './systemActionCreators';
import { SystemEffect } from './types';

describe('askUIStartLoading', () => {
  it('dispatches a StartLoading effect', () => {
    const { action } = captureRequester(askUIStartLoading());

    expect(action).toEqual({
      type: StateActionType.Dispatch,
      payload: { action: { type: SystemEffect.StartLoading, payload: undefined } },
    });
  });
});

describe('askUIStopLoading', () => {
  it('dispatches a StopLoading effect', () => {
    const { action } = captureRequester(askUIStopLoading());

    expect(action).toEqual({
      type: StateActionType.Dispatch,
      payload: { action: { type: SystemEffect.StopLoading, payload: undefined } },
    });
  });
});

describe('askUIShowError', () => {
  it('dispatches a ShowError effect carrying the message, time and id', () => {
    let dispatched: unknown;

    runStory(askUIShowError('boom'), {
      [DateActionType.Now]: '2026-06-26T00:00:00.000Z',
      [GuidActionType.New]: 'guid-1',
      [StateActionType.Dispatch]: (action: StateDispatchAction<unknown>) => {
        dispatched = action.payload.action;
      },
    });

    expect(dispatched).toEqual({
      type: SystemEffect.ShowError,
      payload: { msg: 'boom', at: '2026-06-26T00:00:00.000Z', id: 'guid-1' },
    });
  });
});
