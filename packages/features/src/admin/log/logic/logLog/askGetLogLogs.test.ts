import { DateActionType, KeyValueStoreActionType, LogLevelEnum, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askGetLogLogs } from './askGetLogLogs';

const TIMESTAMP = '2026-06-26T00:00:00.000Z';

describe('askGetLogLogs', () => {
  it('accumulates a single page and returns it', () => {
    const items = [{ reason: 'one' }, { reason: 'two' }];

    const result = runStory(askGetLogLogs(LogLevelEnum.Info, 'start', 'end', '', ''), {
      [DateActionType.Now]: TIMESTAMP,
      [KeyValueStoreActionType.Query]: { items, nextPageKey: undefined },
    });

    expect(result).toEqual({ items, nextPageKey: undefined });
  });
});
