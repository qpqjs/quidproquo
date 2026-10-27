import { describe, expect, it, vi } from 'vitest';

import { askKeyValueStoreQueryBase } from '../../actions/keyValueStore/askKeyValueStoreQuery';
import { KeyValueStoreActionType } from '../../actions/keyValueStore/KeyValueStoreActionType';
import { KvsQueryOperationType } from '../../actions/keyValueStore/types';
import { runStory } from '../../testing/storyTesting';
import { ActionOf } from '../../types';
import { QpqPagedData } from '../../types';
import { askKeyValueStoreQueryAll } from './askKeyValueStoreQueryAll';

const keyCondition = { key: 'pk', operation: KvsQueryOperationType.Equal, valueA: 'scope-1' };

describe('askKeyValueStoreQueryAll', () => {
  it('follows nextPageKey and concatenates every page', () => {
    const pages: Record<string, QpqPagedData<string>> = {
      first: { items: ['a', 'b'], nextPageKey: 'page-2' },
      'page-2': { items: ['c'] },
    };

    const result = runStory(askKeyValueStoreQueryAll('items', keyCondition), {
      [KeyValueStoreActionType.Query]: (action: ActionOf<typeof askKeyValueStoreQueryBase>) => pages[action.payload.options?.nextPageKey ?? 'first'],
    });

    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('makes a single request when there is only one page', () => {
    const query = vi.fn(() => ({ items: ['only'] }));

    const result = runStory(askKeyValueStoreQueryAll('items', keyCondition), { [KeyValueStoreActionType.Query]: query });

    expect(result).toEqual(['only']);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('returns an empty array when the first page is empty', () => {
    const result = runStory(askKeyValueStoreQueryAll('items', keyCondition), { [KeyValueStoreActionType.Query]: { items: [] } });

    expect(result).toEqual([]);
  });

  it('forwards the options (including scope) on every paginated query', () => {
    const scopes: string[] = [];
    const pages: Record<string, QpqPagedData<string>> = {
      first: { items: ['a'], nextPageKey: 'page-2' },
      'page-2': { items: ['b'] },
    };

    // Record the scope of each page request so we can prove none of them dropped it
    const queryRecordingScope = (action: ActionOf<typeof askKeyValueStoreQueryBase>) => {
      scopes.push(action.payload.options?.scope ?? '(none)');
      return pages[action.payload.options?.nextPageKey ?? 'first'];
    };

    const result = runStory(askKeyValueStoreQueryAll('items', keyCondition, { scope: 'scope-a' }), {
      [KeyValueStoreActionType.Query]: queryRecordingScope,
    });

    expect(result).toEqual(['a', 'b']);
    expect(scopes).toEqual(['scope-a', 'scope-a']);
  });
});
