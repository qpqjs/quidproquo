import { Action, DateActionType, KeyValueStoreActionType, LogLevelEnum, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askProcessOnTimeout } from './askProcessOnTimeout';

const TIMESTAMP = '2026-06-26T00:00:00.000Z';

describe('askProcessOnTimeout', () => {
  it('upserts a fatal log when entering the alarm state', () => {
    let captured: Action<any> | undefined;

    runStory(askProcessOnTimeout({ newStateInAlarm: true, newStateReason: 'slow' } as any), {
      [DateActionType.Now]: TIMESTAMP,
      [KeyValueStoreActionType.Upsert]: (action: Action<any>) => {
        captured = action;
      },
    });

    expect(captured?.payload.item).toEqual({
      type: LogLevelEnum.Fatal,
      reason: 'Timeout (Start) - slow',
      timestamp: TIMESTAMP,
    });
  });

  it('upserts an info log when leaving the alarm state', () => {
    let captured: Action<any> | undefined;

    runStory(askProcessOnTimeout({ newStateInAlarm: false, newStateReason: 'ok' } as any), {
      [DateActionType.Now]: TIMESTAMP,
      [KeyValueStoreActionType.Upsert]: (action: Action<any>) => {
        captured = action;
      },
    });

    expect(captured?.payload.item).toEqual({
      type: LogLevelEnum.Info,
      reason: 'Timeout (End) - ok',
      timestamp: TIMESTAMP,
    });
  });
});
