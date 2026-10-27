import { Action, DateActionType, FileActionType, KeyValueStoreActionType, QpqRuntimeType, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askGetLogs } from './askGetLogs';

const TIMESTAMP = '2026-06-26T00:00:00.000Z';

const args = (deep: string, onlyErrors = false) => [QpqRuntimeType.API, 'start', 'end', '', '', '', '', deep, onlyErrors] as const;

describe('askGetLogs', () => {
  it('returns the page items unfiltered when not searching deep', () => {
    const items = [{ correlation: 'a' }, { correlation: 'b' }];

    const result = runStory(askGetLogs(...args('')), {
      [DateActionType.Now]: TIMESTAMP,
      [KeyValueStoreActionType.Query]: { items, nextPageKey: undefined },
    });

    expect(result).toEqual({ items, nextPageKey: undefined });
  });

  it('keeps only logs whose file contents include the deep search term', () => {
    const items = [{ correlation: 'a' }, { correlation: 'b' }];

    const result = runStory(askGetLogs(...args('needle')), {
      [DateActionType.Now]: TIMESTAMP,
      [KeyValueStoreActionType.Query]: { items, nextPageKey: undefined },
      [FileActionType.ReadTextContents]: (action: Action<any>) => (action.payload.filepath === 'a.json' ? 'has needle here' : 'nothing'),
    });

    expect(result.items).toEqual([{ correlation: 'a' }]);
  });
});
