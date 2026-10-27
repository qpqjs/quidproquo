import { describe, expect, it } from 'vitest';

import { runStory } from '../../testing';
import { askStorageScopeProvide, askStorageScopeRead, storageScopeContext } from './storageScopeContext';

describe('storageScopeContext', () => {
  it('defaults to null (unscoped) and is deliberately non-local', () => {
    expect(storageScopeContext.defaultValue).toBeNull();
    // The scope must ride the serialized session across queue/service
    // boundaries, so it must NOT carry the local flag.
    expect(storageScopeContext.local).toBeUndefined();
  });

  it('round-trips a provided scope to a reader inside the wrapped story', () => {
    function* readsScope() {
      return yield* askStorageScopeRead();
    }

    expect(runStory(askStorageScopeProvide('scope-a', readsScope()))).toBe('scope-a');
  });
});
