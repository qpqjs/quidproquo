import { describe, expect, it, vi } from 'vitest';

import { askKeyValueStoreUpdateBase } from '../../actions/keyValueStore/askKeyValueStoreUpdate';
import { KeyValueStoreActionType } from '../../actions/keyValueStore/KeyValueStoreActionType';
import { KvsUpdateActionType } from '../../actions/keyValueStore/types';
import { runStory } from '../../testing/storyTesting';
import { ActionOf } from '../../types';
import { askKeyValueStoreUpdatePartialProperties, InvalidKvsPartialPropertyError } from './askKeyValueStoreUpdatePartialProperties';

interface Widget {
  id: string;
  name: string;
  count: number;
  note?: string;
}

describe('askKeyValueStoreUpdatePartialProperties', () => {
  it('sets valid properties, removes undefined ones, and skips the partition key', () => {
    const update = vi.fn((action: ActionOf<typeof askKeyValueStoreUpdateBase>) => action.payload);

    const result = runStory(
      askKeyValueStoreUpdatePartialProperties<Widget, 'id'>('widgets', 'id', { id: 'w1', name: 'gear', count: 5, note: undefined }),
      { [KeyValueStoreActionType.Update]: update },
    );

    const payload = update.mock.calls[0][0].payload;
    expect(payload.key).toBe('w1');
    expect(payload.sortKey).toBeUndefined();
    expect(payload.updates).toEqual([
      { attributePath: 'name', action: KvsUpdateActionType.Set, value: 'gear' },
      { attributePath: 'count', action: KvsUpdateActionType.Set, value: 5 },
      { attributePath: 'note', action: KvsUpdateActionType.Remove },
    ]);
    expect(result).toBe(payload);
  });

  it('excludes the sort key from the update operations and passes it through', () => {
    const update = vi.fn((action: ActionOf<typeof askKeyValueStoreUpdateBase>) => action.payload);

    runStory(askKeyValueStoreUpdatePartialProperties<Widget, 'id', 'name'>('widgets', 'id', { id: 'w1', name: 'gear', count: 9 }, 'name'), {
      [KeyValueStoreActionType.Update]: update,
    });

    const payload = update.mock.calls[0][0].payload;
    expect(payload.key).toBe('w1');
    expect(payload.sortKey).toBe('gear');
    expect(payload.updates).toEqual([{ attributePath: 'count', action: KvsUpdateActionType.Set, value: 9 }]);
  });

  it('forwards the options (including scope) to the update action', () => {
    const update = vi.fn((action: ActionOf<typeof askKeyValueStoreUpdateBase>) => action.payload);

    runStory(askKeyValueStoreUpdatePartialProperties<Widget, 'id'>('widgets', 'id', { id: 'w1', count: 2 }, undefined, { scope: 'scope-a' }), {
      [KeyValueStoreActionType.Update]: update,
    });

    expect(update.mock.calls[0][0].payload.options).toEqual({ scope: 'scope-a' });
  });

  it('throws InvalidKvsPartialPropertyError instead of silently dropping an unstorable value', () => {
    const update = vi.fn((action: ActionOf<typeof askKeyValueStoreUpdateBase>) => action.payload);

    const act = () =>
      runStory(askKeyValueStoreUpdatePartialProperties<Widget, 'id'>('widgets', 'id', { id: 'w1', count: { nested: { deep: 1 } } as any }), {
        [KeyValueStoreActionType.Update]: update,
      });

    expect(act).toThrowError(InvalidKvsPartialPropertyError);
    expect(update).not.toHaveBeenCalled();
  });
});
