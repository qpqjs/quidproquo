import { describe, expect, it } from 'vitest';

import { createQpqRuntimeDefinition } from './createQpqRuntimeDefinition';
import { getQpqRuntimeAreaKey } from './getQpqRuntimeAreaKey';

const definition = createQpqRuntimeDefinition<{ count: number }, unknown, {}>({
  uniqueName: 'userprofile',
  api: {},
  initialState: { count: 0 },
});

describe('getQpqRuntimeAreaKey', () => {
  it('uses the definition name alone when no instance is given', () => {
    expect(getQpqRuntimeAreaKey(definition)).toBe('userprofile');
  });

  it('appends the instance name after a colon', () => {
    expect(getQpqRuntimeAreaKey(definition, '1234')).toBe('userprofile:1234');
  });
});
