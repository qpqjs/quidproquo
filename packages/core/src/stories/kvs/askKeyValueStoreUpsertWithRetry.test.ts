import { describe, expect, it, vi } from 'vitest';

import { askKeyValueStoreUpsertBase } from '../../actions/keyValueStore/askKeyValueStoreUpsert';
import { KeyValueStoreActionType } from '../../actions/keyValueStore/KeyValueStoreActionType';
import { PlatformActionType } from '../../actions/platform/PlatformActionType';
import { runStory, StoryError, throwsError } from '../../testing/storyTesting';
import { askKeyValueStoreUpsertWithRetry } from './askKeyValueStoreUpsertWithRetry';

const item = { id: '1', name: 'widget' };

describe('askKeyValueStoreUpsertWithRetry', () => {
  it('upserts the item and completes when the store succeeds', () => {
    const upsert = vi.fn();

    runStory(askKeyValueStoreUpsertWithRetry('widgets', item), { [KeyValueStoreActionType.Upsert]: upsert });

    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ payload: expect.objectContaining({ keyValueStoreName: 'widgets', item }) }));
  });

  it('retries ServiceUnavailable failures until the upsert succeeds', () => {
    let attempt = 0;
    const delay = vi.fn();

    runStory(askKeyValueStoreUpsertWithRetry('widgets', item), {
      [KeyValueStoreActionType.Upsert]: () =>
        ++attempt < 3 ? throwsError(askKeyValueStoreUpsertBase.errorType.ServiceUnavailable, 'down') : undefined,
      [PlatformActionType.Delay]: delay,
    });

    expect(attempt).toBe(3);
    expect(delay).toHaveBeenCalledTimes(2);
  });

  it('throws once retries are exhausted', () => {
    expect(() =>
      runStory(askKeyValueStoreUpsertWithRetry('widgets', item, { maxRetries: 1 }), {
        [KeyValueStoreActionType.Upsert]: throwsError(askKeyValueStoreUpsertBase.errorType.ServiceUnavailable, 'down'),
        [PlatformActionType.Delay]: undefined,
      }),
    ).toThrow(StoryError);
  });

  it('does not retry a non-retryable error', () => {
    const upsert = vi.fn(() => throwsError(askKeyValueStoreUpsertBase.errorType.ResourceNotFound, 'missing table'));

    expect(() => runStory(askKeyValueStoreUpsertWithRetry('widgets', item), { [KeyValueStoreActionType.Upsert]: upsert })).toThrow(/missing table/);
    expect(upsert).toHaveBeenCalledTimes(1);
  });
});
