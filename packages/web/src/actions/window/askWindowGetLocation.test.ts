import { captureRequester } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askWindowGetLocation } from './askWindowGetLocation';
import { WindowActionType } from './WindowActionType';

describe('askWindowGetLocation', () => {
  it('yields a GetLocation action', () => {
    const { action } = captureRequester(askWindowGetLocation());

    expect(action).toEqual({ type: WindowActionType.GetLocation });
  });

  it('returns the value the runtime resolves', () => {
    const location = { href: 'https://example.com/path' };
    const { returned } = captureRequester(askWindowGetLocation(), location);

    expect(returned).toEqual(location);
  });
});
