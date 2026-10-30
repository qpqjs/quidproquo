import { Action, DateActionType, KeyValueStoreActionType, LogLevelEnum } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askNotifyErrorProcessThrottle } from './askNotifyErrorProcessThrottle';

const TIMESTAMP = '2026-06-26T00:00:00.000Z';

describe('askNotifyErrorProcessThrottle', () => {
  it.each([
    [true, 'Throttle (Start) - hit'],
    [false, 'Throttle (End) - hit'],
  ])('always upserts a warn log (inAlarm=%s)', (newStateInAlarm: boolean, reason: string) => {
    let captured: Action<any> | undefined;

    runStory(askNotifyErrorProcessThrottle({ newStateInAlarm, newStateReason: 'hit' } as any), {
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
