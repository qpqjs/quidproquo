import { Action, DateActionType, KeyValueStoreActionType, LogLevelEnum, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askProcessOnThrottle } from './askProcessOnThrottle';

const TIMESTAMP = '2026-06-26T00:00:00.000Z';

describe('askProcessOnThrottle', () => {
  it.each([
    [true, 'Throttle (Start) - hit'],
    [false, 'Throttle (End) - hit'],
  ])('always upserts a warn log (inAlarm=%s)', (newStateInAlarm: boolean, reason: string) => {
    let captured: Action<any> | undefined;

    runStory(askProcessOnThrottle({ newStateInAlarm, newStateReason: 'hit' } as any), {
      [DateActionType.Now]: TIMESTAMP,
      [KeyValueStoreActionType.Upsert]: (action: Action<any>) => {
        captured = action;
      },
    });

    expect(captured?.payload.item).toEqual({
      type: LogLevelEnum.Warn,
      reason,
      timestamp: TIMESTAMP,
    });
  });
});
