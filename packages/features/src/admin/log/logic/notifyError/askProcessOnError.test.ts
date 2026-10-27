import { Action, DateActionType, KeyValueStoreActionType, LogLevelEnum, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askProcessOnError } from './askProcessOnError';

const TIMESTAMP = '2026-06-26T00:00:00.000Z';

describe('askProcessOnError', () => {
  it('upserts a fatal log when entering the alarm state', () => {
    let captured: Action<any> | undefined;

    runStory(askProcessOnError({ newStateInAlarm: true, newStateReason: 'boom' } as any), {
      [DateActionType.Now]: TIMESTAMP,
      [KeyValueStoreActionType.Upsert]: (action: Action<any>) => {
        captured = action;
      },
    });

    expect(captured?.payload.item).toEqual({
      type: LogLevelEnum.Fatal,
      reason: 'Error (Start) - boom',
      timestamp: TIMESTAMP,
    });
  });

  it('upserts an info log when leaving the alarm state', () => {
    let captured: Action<any> | undefined;

    runStory(askProcessOnError({ newStateInAlarm: false, newStateReason: 'recovered' } as any), {
      [DateActionType.Now]: TIMESTAMP,
      [KeyValueStoreActionType.Upsert]: (action: Action<any>) => {
        captured = action;
      },
    });

    expect(captured?.payload.item).toEqual({
      type: LogLevelEnum.Info,
      reason: 'Error (End) - recovered',
      timestamp: TIMESTAMP,
    });
  });
});
