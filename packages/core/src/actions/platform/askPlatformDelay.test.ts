import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askPlatformDelay } from './askPlatformDelay';
import { PlatformActionType } from './PlatformActionType';

describe('askPlatformDelay', () => {
  it('yields a Delay action with the delay in milliseconds', () => {
    const { action } = captureRequester(askPlatformDelay(250));

    expect(action).toEqual({ type: PlatformActionType.Delay, payload: { timeMs: 250 } });
  });
});
