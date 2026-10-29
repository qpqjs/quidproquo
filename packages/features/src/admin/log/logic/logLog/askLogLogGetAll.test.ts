import { DateActionType, KeyValueStoreActionType, LogLevelEnum } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askLogLogGetAll } from './askLogLogGetAll';

const TIMESTAMP = '2026-06-26T00:00:00.000Z';

describe('askLogLogGetAll', () => {
  it('accumulates a single page and returns it', () => {
    const items = [{ reason: 'one' }, { reason: 'two' }];

    const result = runStory(askLogLogGetAll(LogLevelEnum.Info, 'start', 'end', '', ''), {
      [DateActionType.Now]: TIMESTAMP,
      [KeyValueStoreActionType.Query]: { items, nextPageKey: undefined },
    });

    expect(result).toEqual({ items, nextPageKey: undefined });
  });
});
