import { describe, expect, it } from 'vitest';

import { ConfigActionType } from '../actions/config/ConfigActionType';
import { runStory, throwsError } from '../testing/storyTesting';
import { askGetApplicationVersion } from './askGetApplicationVersion';

describe('askGetApplicationVersion', () => {
  it('returns the global version when it resolves', () => {
    const result = runStory(askGetApplicationVersion(), { [ConfigActionType.GetGlobal]: 'v1.2.3' });

    expect(result).toBe('v1.2.3');
  });

  it('returns null when the global lookup fails', () => {
    const result = runStory(askGetApplicationVersion(), {
      [ConfigActionType.GetGlobal]: throwsError('NotFound', 'no version global'),
    });

    expect(result).toBeNull();
  });
});
