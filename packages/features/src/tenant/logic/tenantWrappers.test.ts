import { ContextActionType, FileActionType, KeyValueStoreActionType, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askActiveTenantProvide } from '../context/askActiveTenantProvide';
import { askTenantFileExists } from './file/askTenantFileExists';
import { askTenantKeyValueStoreUpsert } from './keyValueStore/askTenantKeyValueStoreUpsert';

describe('tenant-aware wrapper requesters', () => {
  it('passes the provided tenant as the file action scope', () => {
    let seenScope: string | undefined;

    const result = runStory(askActiveTenantProvide('tenant-a', askTenantFileExists('media', 'a.txt')), {
      [FileActionType.Exists]: (action: { payload: { scope?: string } }) => {
        seenScope = action.payload.scope;
        return true;
      },
    });

    expect(result).toBe(true);
    expect(seenScope).toBe('tenant-a');
  });

  it('passes the provided tenant as the kvs options scope, preserving other options', () => {
    let seenOptions: { scope?: string; ifNotExists?: boolean } | undefined;

    runStory(askActiveTenantProvide('tenant-a', askTenantKeyValueStoreUpsert('widgets', { id: 'w1' }, { ifNotExists: true })), {
      [KeyValueStoreActionType.Upsert]: (action: { payload: { options?: { scope?: string; ifNotExists?: boolean } } }) => {
        seenOptions = action.payload.options;
        return undefined;
      },
    });

    expect(seenOptions).toEqual({ ifNotExists: true, scope: 'tenant-a' });
  });

  it('throws when no active scope has been provided', () => {
    const unprovidedContext = {
      // No provider wraps the story, so the read falls back to the identifier default (null).
      [ContextActionType.Read]: () => null,
    };

    expect(() => runStory(askTenantFileExists('media', 'a.txt'), unprovidedContext)).toThrow(/No active scope/);
  });
});
