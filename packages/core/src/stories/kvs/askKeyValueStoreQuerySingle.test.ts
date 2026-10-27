import { describe, expect, it, vi } from 'vitest';

import { askKeyValueStoreQueryBase } from '../../actions/keyValueStore/askKeyValueStoreQuery';
import { KeyValueStoreActionType } from '../../actions/keyValueStore/KeyValueStoreActionType';
import { KvsQueryOperationType } from '../../actions/keyValueStore/types';
import { runStory } from '../../testing/storyTesting';
import { ActionOf } from '../../types';
import { QpqPagedData } from '../../types';
import { askKeyValueStoreQuerySingle } from './askKeyValueStoreQuerySingle';

const keyCondition = { key: 'pk', operation: KvsQueryOperationType.Equal, valueA: 'scope-1' };

describe('askKeyValueStoreQuerySingle', () => {
  it('returns the first item from the page', () => {
    const result = runStory(askKeyValueStoreQuerySingle<string>('items', keyCondition), {
      [KeyValueStoreActionType.Query]: { items: ['first', 'second'] },
    });

    expect(result).toBe('first');
  });

  it('returns null when no items are found', () => {
    const result = runStory(askKeyValueStoreQuerySingle<string>('items', keyCondition), {
      [KeyValueStoreActionType.Query]: { items: [] },
    });

    expect(result).toBeNull();
  });

  it('makes a single query when the limit is reached', () => {
    const query = vi.fn(() => ({ items: ['only'] }));

    const result = runStory(askKeyValueStoreQuerySingle<string>('items', keyCondition), { [KeyValueStoreActionType.Query]: query });

    expect(result).toBe('only');
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('returns an item found on an earlier page even when the final page is empty', () => {
    // A filter can leave later pages empty; the match from page one must still win
    const pages: Record<string, QpqPagedData<string>> = {
      first: { items: ['match'], nextPageKey: 'page-2' },
      'page-2': { items: [] },
    };

    const result = runStory(askKeyValueStoreQuerySingle<string>('items', keyCondition, undefined, undefined, 2), {
      [KeyValueStoreActionType.Query]: (action: ActionOf<typeof askKeyValueStoreQueryBase>) => pages[action.payload.options?.nextPageKey ?? 'first'],
    });

    expect(result).toBe('match');
  });

  it('returns the first item overall, not the first item of the last page', () => {
    const pages: Record<string, QpqPagedData<string>> = {
      first: { items: ['first'], nextPageKey: 'page-2' },
      'page-2': { items: ['second', 'third'] },
    };

    const result = runStory(askKeyValueStoreQuerySingle<string>('items', keyCondition, undefined, undefined, 2), {
      [KeyValueStoreActionType.Query]: (action: ActionOf<typeof askKeyValueStoreQueryBase>) => pages[action.payload.options?.nextPageKey ?? 'first'],
    });

    expect(result).toBe('first');
  });

  it('forwards the scope on every paginated query', () => {
    const scopes: string[] = [];
    const pages: Record<string, QpqPagedData<string>> = {
      first: { items: [], nextPageKey: 'page-2' },
      'page-2': { items: ['found'] },
    };

    // Record the scope of each page request so we can prove none of them dropped it
    const queryRecordingScope = (action: ActionOf<typeof askKeyValueStoreQueryBase>) => {
      scopes.push(action.payload.options?.scope ?? '(none)');
      return pages[action.payload.options?.nextPageKey ?? 'first'];
    };

    const result = runStory(askKeyValueStoreQuerySingle<string>('items', keyCondition, undefined, undefined, 1, 'scope-a'), {
      [KeyValueStoreActionType.Query]: queryRecordingScope,
    });

    expect(result).toBe('found');
    expect(scopes).toEqual(['scope-a', 'scope-a']);
  });
});
